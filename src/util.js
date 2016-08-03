'use strict';

const logger = require('logger');
const crypto = require('crypto');
const fs = require('fs');
const logError = logger.error;
const logWarn = logger.warn;
let gpgOptions = {};

module.exports = {
    log: logger.log,
    logError: logError,
    logInfo: logger.info,
    logRaw: logger.raw,
    logSuccess: logger.success,
    logWarn: logWarn,

    fileExists: path =>
        new Promise((resolve, reject) =>
            fs.stat(path, err => {
                if (err) {
                    reject('No matching entry');
                } else {
                    resolve(path);
                }
            })
        ),

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

    getDefaultFileOptions: () => {
        return {
            flags: 'w',
            defaultEncoding: 'utf8',
            fd: null,
            mode: 0o0600
        };
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
    },

    setGPGOptions: data => gpgOptions = JSON.parse(data)
};

