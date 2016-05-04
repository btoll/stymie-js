// TODO: are nested .catch()s needed?

'use strict';

const diceware = require('diceware');
const inquirer = require('inquirer');
const jcrypt = require('jcrypt');
const libKey = require('./key');
const libFile = require('./file');
const libUtil = require('./util');
const log = libUtil.log;
const logError = libUtil.logError;
const logInfo = libUtil.logInfo;
const logSuccess = libUtil.logSuccess;
const env = process.env;
const keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`;

const stymie = {
    add: key => {
        if (!key) {
            logError('No key name');
            return;
        }

        libKey.make(key);
    },

    addFile: file => {
        if (!file) {
            logError('No file name');
            return;
        }

        libFile.add(file);
    },

    edit: key => {
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data => {
            const list = JSON.parse(data);
            const item = list[key];
            let prompts, hasChanged;

            if (item) {
                hasChanged = {
                    changed: false
                };

                prompts = [{
                    type: 'input',
                    name: 'key',
                    message: 'Edit key:',
                    default: key,
                    validate: libUtil.noDuplicates.bind(null, key, list)
                }];

                // TODO: Use iterator here.
                for (let n in item) {
                    if (item.hasOwnProperty(n)) {
                        prompts.push({
                            type: 'input',
                            name: n,
                            message: `Edit ${n}:`,
                            default: item[n],
                            validate: libUtil.hasChanged.bind(null, hasChanged, n)
                        });
                    }
                }

                inquirer.prompt(prompts, answers => {
                    const entry = answers.key;
                    let item = list[key];

                    if (entry !== key) {
                        // Remove old key.
                        delete list[key];

                        item = list[key] = {};

                        // Note if the key has changed the condition
                        // below will always pass.
                    }

                    if (hasChanged.changed) {
                        // TODO: Iterator.
                        for (let n in answers) {
                            if (answers.hasOwnProperty(n) && n !== 'key') {
                                item[n] = answers[n];
                            }
                        }

                        jcrypt.stream(JSON.stringify(list, null, 4), keyFile, {
                            gpg: libUtil.getGPGArgs(),
                            file: {
                                flags: 'w',
                                defaultEncoding: 'utf8',
                                fd: null,
                                mode: 0o0600
                            }
                        }, true)
                        .then(() => {
                            logSuccess('Key has been updated');
                        })
                        .catch(logError);
                    } else {
                        logInfo('No change');
                    }
                });
            } else {
                logInfo('No matching key');
            }
        })
        .catch(logError);
    },

    editFile: key => libFile.edit(key),

    generate: () => log(diceware.generate()),

    get: (key, field) => {
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data => {
            const list = JSON.parse(data);
            const item = list[key];

            if (item) {
                if (!field) {
                    // TODO: Iterator.
                    for (let n in item) {
                        if (item.hasOwnProperty(n) && n !== 'key') {
                            log(`${n}: ${item[n]}`);
                        }
                    }
                } else {
                    const f = item[field];

                    if (!f) {
                        logError('No field found');
                    } else {
                        log(f);
                    }
                }
            } else {
                logInfo('No matching key');
            }
        })
        .catch(logError);
    },

    getFile: key => libFile.get(key),

    has: key => {
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data => {
            logInfo(
                JSON.parse(data)[key] ?
                    'Key exists' :
                    'No matching key'
            );
        })
        .catch(logError);
    },

    hasFile: key => libFile.has(key),

    list: () => {
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data => {
            const keys = Object.keys(JSON.parse(data));

            logInfo(
                !keys.length ?
                    'No installed keys' :
                    `Installed keys: ${keys.sort().join(', ')}`
            );
        });
    },

    listFile: () => logInfo('Not implemented'),

    rm: key => {
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data => {
            const list = JSON.parse(data);

            return new Promise((resolve, reject) => {
                if (list[key]) {
                    inquirer.prompt([{
                        type: 'list',
                        name: 'rm',
                        message: 'Are you sure?',
                        choices: [
                            {name: 'Yes', value: true},
                            {name: 'No', value: false}
                        ],
                        default: false
                    }], answers => {
                        if (answers.rm) {
                            delete list[key];
                            resolve(list);

                        } else {
                            reject('No removal');
                        }
                    });
                } else {
                    reject('No matching key');
                }
            });
        })
        .then(list => {
            return jcrypt.stream(JSON.stringify(list, null, 4), keyFile, {
                gpg: libUtil.getGPGArgs(),
                file: {
                    flags: 'w',
                    defaultEncoding: 'utf8',
                    fd: null,
                    mode: 0o0600
                }
            }, true)
            .then(() => {
                logSuccess('Key has been removed');
            })
            .catch(logError);
        })
        .catch(logError);
    },

    rmFile: key => libFile.rm(key)
};

module.exports = stymie;

