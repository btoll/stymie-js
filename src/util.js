'use strict';

const R = require('ramda');
const fs = require('fs');
const jcrypt = require('jcrypt');
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

const util = {
    log: logger.log,
    logError: logError,
    logInfo: logger.info,
    logRaw: logger.raw,
    logSuccess: logger.success,
    logWarn: logWarn,

    // Will be defined in #setGPGOptions.
    encrypt: null,

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

    getNewFieldsPrompts: () =>
        [{
            type: 'list',
            name: 'createNewField',
            message: 'Create another field?:',
            choices: [
                {name: 'Yes', value: true},
                {name: 'No', value: false}
            ]
        }, {
            type: 'input',
            name: 'name',
            message: 'Name:',
            validate: util.noBlanks,
            when: answers => answers.createNewField
        }, {
            type: 'input',
            name: 'value',
            message: 'Value:',
            validate: util.noBlanks,
            when: answers => answers.createNewField
        }],

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

    setGPGOptions: options => {
        const gpgOptions = [
            '-r', options.recipient
        ];

        if (options.armor) {
            gpgOptions.push('--armor');
        }

        if (options.sign) {
            gpgOptions.push('--sign');
        }

        util.encrypt = jcrypt.encrypt(gpgOptions);
    },

    writeFile: R.curry((dest, enciphered) =>
        new Promise((resolve, reject) =>
            fs.writeFile(dest, enciphered, defaultWriteOptions, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(dest);
                }
            })
        ))
};

module.exports = util;

