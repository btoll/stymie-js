'use strict';

const R = require('ramda');
const fs = require('fs');
const jcrypt = require('jcrypt');
const logger = require('logger');

const env = process.env;
const keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`;

const logError = logger.error;
const logWarn = logger.warn;

const defaultWriteOptions = {
    defaultEncoding: 'utf8',
    encoding: 'utf8',
    fd: null,
    flags: 'w',
    mode: 0o0600
};

const fileExists = path =>
    new Promise((resolve, reject) =>
        fs.stat(path, err => {
            if (err) {
                reject('No matching entry');
            } else {
                resolve(path);
            }
        })
    );

const getKeyFile = () => keyFile;

const noBlanks = input => {
    let res = true;

    if (!input) {
        logError('Cannot be blank');
        res = false;
    }

    return res;
};

const noDuplicates = (current, list, input) => {
    let res = true;

    if ((current !== input) && list[input]) {
        logWarn('Key already exists');
        res = false;
    }

    return res;
};

const setGPGOptions = options => {
    const gpgOptions = [
        '--hidden-recipient', options.recipient
    ];

    if (options.armor) {
        gpgOptions.push('--armor');
    }

    if (options.sign) {
        gpgOptions.push('--sign');
    }

    const encrypt = util.encrypt = jcrypt.encrypt(gpgOptions);

    util.encryptAndWrite = R.compose(
        R.composeP(writeKeyFile, encrypt),
        stringify
    );
};

const stringify = list =>
    JSON.stringify(list, null, 4);

const writeFile = R.curry((dest, enciphered) =>
    new Promise((resolve, reject) =>
        fs.writeFile(dest, enciphered, defaultWriteOptions, err => {
            if (err) {
                reject(err);
            } else {
                resolve(dest);
            }
        })
    ));

const writeKeyFile = writeFile(keyFile);

const util = {
    // Will be defined in #setGPGOptions.
    encrypt: null,
    encryptAndWrite: null,

    log: logger.log,
    logError: logError,
    logInfo: logger.info,
    logRaw: logger.raw,
    logSuccess: logger.success,
    logWarn: logWarn,

    fileExists,
    getKeyFile,
    noBlanks,
    noDuplicates,
    setGPGOptions,
    writeFile
};

module.exports = util;

