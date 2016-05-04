'use strict';

const logger = require('logger');
const crypto = require('crypto');
const fs = require('fs');
const log = logger.log;
const logError = logger.error;
const logInfo = logger.info;
const logSuccess = logger.success;
const logWarn = logger.warn;
let gpgOptions;

module.exports = {
    log: log,
    logError: logError,
    logInfo: logInfo,
    logSuccess: logSuccess,
    logWarn: logWarn,

    fileExists: path => {
        return new Promise((resolve, reject) => {
            fs.stat(path, (err) => {
                if (err) {
                    reject('No matching entry');
                } else {
                    resolve(path);
                }
            });
        });
    },

    getGPGArgs: () => {
        let arr = ['--encrypt', '-r', gpgOptions.recipient];

        if (gpgOptions.armor) {
            arr.push('--armor');
        }

        if (gpgOptions.sign) {
            arr.push('--sign');
        }

        return arr;
    },

    setGPGOptions: data => {
        gpgOptions = JSON.parse(data);
    },

    hasChanged: (hasChanged, originalValue, input) => {
        if (originalValue !== input) {
            hasChanged.changed = true;
        }

        return true;
    },

    hashFilename: file => {
        if (!file) {
            return;
        }

        return crypto.createHash(gpgOptions.hash).update(file).digest('hex');
    },

    noBlanks: input => {
        let res = true;

        if (!input) {
            logError('Cannot be blank');
            res = false;
        }

        return res;
    },

    noDuplicates: (current, list, input) => {
        let res = true;

        if ((current !== input) && list[input]) {
            logWarn('Key already exists');
            res = false;
        }

        return res;
    }
};

