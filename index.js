/* eslint-disable no-console */

// TODO: are nested .catch()s needed?

(() => {
    'use strict';

    let diceware = require('diceware'),
        fs = require('fs'),
        inquirer = require('inquirer'),
        jcrypt = require('jcrypt'),
        libFile = require('./lib/file'),
        util = require('./lib/util'),
        logError = util.logError,
        logInfo = util.logInfo,
        logSuccess = util.logSuccess,
        env = process.env,
        listFile = `${env.STYMIE || env.HOME}/.stymie.d/l`,
        Stymie;

    function generatePassphrase(entry, username, password) {
        console.log(password = diceware.generate());

        inquirer.prompt([{
            type: 'list',
            name: 'password',
            message: 'Accept?:',
            choices: [
                {name: 'Yes', value: true},
                {name: 'No, generate another', value: false}
            ]
        }], (answers) => {
            if (answers.password) {
                makeListEntry(entry, username, password)
                .then(() => {
                    logSuccess('Created new entry');
                })
                .catch(logError);
            } else {
                generatePassphrase(entry, username, password);
            }
        });
    }

    function makeListEntry(entry, username, password) {
        return jcrypt(listFile, null, ['--decrypt'], true)
        .then((data) => {
            let list = JSON.parse(data);

            list[entry] = {
                username: username,
                password: password
            };

            return jcrypt.stream(JSON.stringify(list, null, 4), listFile, {
                gpg: util.getGPGArgs(),
                file: {
                    flags: 'w',
                    defaultEncoding: 'utf8',
                    fd: null,
                    mode: 0o0600
                }
            }, true)
        });
    }

    Stymie = {
        add: (entry, onFile) => {
            if (!entry) {
                logError('No entry name');
                return;
            }

            if (!onFile) {
                jcrypt(listFile, null, ['--decrypt'], true)
                .then((data) => {
                    let list = JSON.parse(data);

                    if (list[entry]) {
                        logInfo('Entry already exists');
                    } else {
                        inquirer.prompt([{
                            type: 'input',
                            name: 'username',
                            message: 'Enter username:',
                            validate: util.noBlanks
                        }, {
                            type: 'list',
                            name: 'generatePassword',
                            message: 'Generate diceware password?',
                            default: false,
                            choices: [
                                {name: 'Yes', value: true},
                                {name: 'No', value: false}
                            ]
                        }, {
                            type: 'password',
                            name: 'password',
                            message: 'Enter password:',
                            validate: util.noBlanks,
                            when: (answers) => {
                                return !answers.generatePassword;
                            }
                        }], (answers) => {
                            if (answers.generatePassword) {
                                generatePassphrase(entry, answers.username, answers.password);
                            } else {
                                makeListEntry(entry, answers.username, answers.password)
                                .then(() => {
                                    logSuccess('Created new entry');
                                })
                                .catch(logError);
                            }
                        });
                    }
                })
                .catch(logError);
            } else {
                libFile.add(entry);
            }
        },

        edit: (entry, onFile) => {
            if (!onFile) {
                jcrypt(listFile, null, ['--decrypt'], true)
                .then((data) => {
                    let list = JSON.parse(data),
                        item = list[entry];

                    if (item) {
                        inquirer.prompt([{
                            type: 'input',
                            name: 'key',
                            message: 'Edit key:',
                            default: entry,
                            validate: util.noDuplicates.bind(null, list)
                        }, {
                            type: 'input',
                            name: 'username',
                            message: 'Edit username:',
                            default: item.username
                        }, {
                            type: 'input',
                            name: 'password',
                            message: 'Edit password:',
                            default: item.password
                        }], (answers) => {
                            let key = answers.key,
                                username = answers.username,
                                password = answers.password;

                            if (key !== entry) {
                                // Remove old entry.
                                delete list[entry];

                                item = list[key] = {};

                                // Note if the key has changed the condition
                                // below will always pass.
                            }

                            if (username !== item.username || password !== item.password) {
                                item.username = username;
                                item.password = password;

                                jcrypt.stream(JSON.stringify(list, null, 4), listFile, {
                                    gpg: util.getGPGArgs(),
                                    file: {
                                        flags: 'w',
                                        defaultEncoding: 'utf8',
                                        fd: null,
                                        mode: 0o0600
                                    }
                                }, true)
                                .then(() => {
                                    logSuccess('Entry has been updated');
                                })
                                .catch(logError);
                            } else {
                                logInfo('No change');
                            }
                        });
                    } else {
                        logInfo('No matching entry');
                    }
                })
                .catch(logError);
            } else {
                libFile.edit(entry);
            }
        },

        generate: () => {
            console.log(diceware.generate());
        },

        get: (entry, onFile) => {
            if (!onFile) {
                jcrypt(listFile, null, ['--decrypt'], true)
                .then((data) => {
                    let list = JSON.parse(data),
                        item = list[entry];

                    if (item) {
                        console.log(`username = ${item.username}, password = ${item.password}`);
                    } else {
                        logInfo('No matching entry');
                    }
                }).catch(logError);
            } else {
                libFile.get(entry);
            }
        },

        has: (entry, onFile) => {
            if (!onFile) {
                jcrypt(listFile, null, ['--decrypt'], true)
                .then((data) => {
                    logInfo(
                        JSON.parse(data)[entry] ?
                            'Entry exists' :
                            'No matching entry'
                    );
                }).catch(logError);
            } else {
                libFile.has(entry);
            }
        },

        list: (onFile) => {
            if (!onFile) {
                jcrypt(listFile, null, ['--decrypt'], true)
                .then((data) => {
                    logInfo('Installed keys:', Object.keys(JSON.parse(data)).sort().join(', '));
                });
            } else {
                // TODO
                logInfo('Not implemented');
            }
        },

        remove: (entry, onFile) => {
            if (!onFile) {
                jcrypt(listFile, null, ['--decrypt'], true)
                .then((data) => {
                    let list = JSON.parse(data);

                    return new Promise((resolve, reject) => {
                        if (list[entry]) {
                            inquirer.prompt([{
                                type: 'list',
                                name: 'remove',
                                message: 'Are you sure?',
                                choices: [
                                    {name: 'Yes', value: true},
                                    {name: 'No', value: false}
                                ]
                            }], (answers) => {
                                if (answers.remove) {
                                    delete list[entry];
                                    resolve(list);

                                } else {
                                    reject('No removal');
                                }
                            });
                        } else {
                            reject('No matching entry');
                        }
                    });
                })
                .then((list) => {
                    return jcrypt.stream(JSON.stringify(list, null, 4), listFile, {
                        gpg: util.getGPGArgs(),
                        file: {
                            flags: 'w',
                            defaultEncoding: 'utf8',
                            fd: null,
                            mode: 0o0600
                        }
                    }, true)
                    .then(() => {
                        logSuccess('Entry has been removed');
                    })
                    .catch(logError);
                })
                .catch(logError);
            } else {
                libFile.remove(entry);
            }
        }
    };

    module.exports = Stymie;
})();

