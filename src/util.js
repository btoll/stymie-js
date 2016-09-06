'use strict';

const R = require('ramda');
const fs = require('fs');
const logger = require('logger');

const logError = logger.error;
const logWarn = logger.warn;
const defaultWriteOptions = {
    defaultEncoding: 'utf8',
    encoding: 'utf8',
    fd: null,
    flags: 'w',
    mode: 0o0600
};

let gpgOptions = {};

const util = {
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
        let arr = ['-r', gpgOptions.recipient];

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

    setGPGOptions: data => gpgOptions = JSON.parse(data),

    // TODO: (writeOptions = defaultWriteOptions, dest, data)
    writeFile: R.curry((writeOptions, dest, enciphered) =>
        new Promise((resolve, reject) =>
            fs.writeFile(dest, enciphered, writeOptions || defaultWriteOptions, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(dest);
                }
            })
        ))
};

module.exports = util;

