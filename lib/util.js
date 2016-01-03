/* eslint-disable no-console */

(() => {
    'use strict';

    let crypto = require('crypto'),
        fs = require('fs'),
        gpgOptions;

    function makeLogger(type) {
        return console.log.bind(console, type);
    }

    module.exports = {
        logError: makeLogger('[ERROR]'),
        logInfo: makeLogger('[INFO]'),
        logSuccess: makeLogger('[SUCCESS]'),

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

        getGPGOptions: () => {
            return gpgOptions;
        },

        setGPGOptions: (data) => {
            gpgOptions = JSON.parse(data);
        },

        hashFilename: (file) => {
            if (!file) {
                return;
            }

            return crypto.createHash(gpgOptions.hash).update(file).digest('hex');
        }

        /*
        readFile: (path) => {
            return new Promise((resolve, reject) => {
                fs.readFile(path, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        }
        */
    };
})();

