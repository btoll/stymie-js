/* eslint-disable no-console */

(() => {
    'use strict';

    let crypto = require('crypto'),
        fs = require('fs'),
        log = console.log,
        logError, logInfo, logSuccess, logWarning, gpgOptions;

    function makeLogger(type) {
        return log.bind(console, type);
    }

    logError = makeLogger('[ERROR]');
    logInfo = makeLogger('[INFO]');
    logSuccess = makeLogger('[SUCCESS]');
    logWarning = makeLogger('[WARNING]');

    module.exports = {
        log: log,
        logError: logError,
        logInfo: logInfo,
        logSuccess: logSuccess,
        logWarning: logWarning,

        fileExists: (path) => {
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

        setGPGOptions: (data) => {
            gpgOptions = JSON.parse(data);
        },

        hasChanged: (hasChanged, originalValue, input) => {
            if (originalValue !== input) {
                hasChanged.changed = true;
            }

            return true;
        },

        hashFilename: (file) => {
            if (!file) {
                return;
            }

            return crypto.createHash(gpgOptions.hash).update(file).digest('hex');
        },

        noBlanks: (input) => {
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
                logWarning('Key already exists');
                res = false;
            }

            return res;
        }
    };
})();

