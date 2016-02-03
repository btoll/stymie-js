// TODO: are nested .catch()s needed?

(() => {
    'use strict';

    let diceware = require('diceware'),
        fs = require('fs'),
        inquirer = require('inquirer'),
        jcrypt = require('jcrypt'),
        libKey = require('./lib/key'),
        libFile = require('./lib/file'),
        libUtil = require('./lib/util'),
        log = libUtil.log,
        logError = libUtil.logError,
        logInfo = libUtil.logInfo,
        logSuccess = libUtil.logSuccess,
        env = process.env,
        keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`,
        Stymie;

    Stymie = {
        add: (key, onFile) => {
            if (!key) {
                logError('No key name');
                return;
            }

            if (!onFile) {
                libKey.make(key);
            } else {
                libFile.add(key);
            }
        },

        edit: (key, onFile) => {
            if (!onFile) {
                jcrypt(keyFile, null, ['--decrypt'], true)
                .then((data) => {
                    let list = JSON.parse(data),
                        item = list[key],
                        prompts, hasChanged;

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

                        inquirer.prompt(prompts, (answers) => {
                            let entry = answers.key,
                                item = list[key];

                            if (entry !== key) {
                                // Remove old key.
                                delete list[key];

                                item = list[key] = {};

                                // Note if the key has changed the condition
                                // below will always pass.
                            }

                            if (hasChanged.changed) {
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
            } else {
                libFile.edit(key);
            }
        },

        generate: () => {
            log(diceware.generate());
        },

        get: (key, onFile, field) => {
            if (!onFile) {
                jcrypt(keyFile, null, ['--decrypt'], true)
                .then((data) => {
                    let list = JSON.parse(data),
                        item = list[key];

                    if (item) {
                        if (!field) {
                            for (let n in item) {
                                if (item.hasOwnProperty(n) && n !== 'key') {
                                    log(`${n}: ${item[n]}`);
                                }
                            }
                        } else {
                            let f = item[field];

                            if (!f) {
                                logError('No field found');
                            } else {
                                log(f);
                            }
                        }
                    } else {
                        logInfo('No matching key');
                    }
                }).catch(logError);
            } else {
                libFile.get(key);
            }
        },

        has: (key, onFile) => {
            if (!onFile) {
                jcrypt(keyFile, null, ['--decrypt'], true)
                .then((data) => {
                    logInfo(
                        JSON.parse(data)[key] ?
                            'Key exists' :
                            'No matching key'
                    );
                }).catch(logError);
            } else {
                libFile.has(key);
            }
        },

        list: (onFile) => {
            if (!onFile) {
                jcrypt(keyFile, null, ['--decrypt'], true)
                .then((data) => {
                    let keys = Object.keys(JSON.parse(data)),
                        msg;

                    msg = !keys.length ?
                        'No installed keys' :
                        `Installed keys: ${keys.sort().join(', ')}`;

                    logInfo(msg);
                });
            } else {
                // TODO
                logInfo('Not implemented');
            }
        },

        remove: (key, onFile) => {
            if (!onFile) {
                jcrypt(keyFile, null, ['--decrypt'], true)
                .then((data) => {
                    let list = JSON.parse(data);

                    return new Promise((resolve, reject) => {
                        if (list[key]) {
                            inquirer.prompt([{
                                type: 'list',
                                name: 'remove',
                                message: 'Are you sure?',
                                choices: [
                                    {name: 'Yes', value: true},
                                    {name: 'No', value: false}
                                ],
                                default: false
                            }], (answers) => {
                                if (answers.remove) {
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
                .then((list) => {
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
            } else {
                libFile.remove(key);
            }
        }
    };

    module.exports = Stymie;
})();

