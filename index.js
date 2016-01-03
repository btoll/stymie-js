/* eslint-disable no-console */

// TODO: are nested .catch()s needed?

(() => {
    'use strict';

    let diceware = require('diceware'),
        fs = require('fs'),
        inquirer = require('inquirer'),
        jcrypt = require('jcrypt'),
        util = require('./lib/util'),
        logError = util.logError,
        logInfo = util.logInfo,
        logSuccess = util.logSuccess,
        env = process.env,
        stymieDir = `${env.STYMIE || env.HOME}/.stymie.d`,
        entryDir = `${stymieDir}/s`,
        Stymie;

    Stymie = {
        add: (() => {
            let newEntry, password, hashedFilename;

            function formatData(username, password) {
                return `${newEntry}\n\t${username}\n\t${password}`;
            }

            function generatePassphrase(username) {
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
                        makeFileEntry(username, password);
                    } else {
                        generatePassphrase(username);
                    }
                });
            }

            function makeFileEntry(username, password) {
                let listFile = `${stymieDir}/l`;

                jcrypt.stream(formatData(username, password), `${entryDir}/${hashedFilename}`, {
                    gpg: util.getGPGArgs(),
                    file: {
                        flags: 'w',
                        defaultEncoding: 'utf8',
                        fd: null,
                        mode: 0o0600
                    }
                }, true)
                .then(() => {
                    logSuccess('Entry created');

                    return jcrypt(listFile, null, ['--decrypt'], true);
                })
                .then((data) => {
                    let list = new Set(JSON.parse(data));
                    list.add(newEntry);

                    return jcrypt.stream(JSON.stringify(Array.from(list), null, 4), `${stymieDir}/l`, {
                        gpg: util.getGPGArgs(),
                        file: {
                            flags: 'w',
                            defaultEncoding: 'utf8',
                            fd: null,
                            mode: 0o0600
                        }
                    }, true);
                })
                .then(logSuccess)
                .catch(logError);
            }

            return (entry) => {
                if (!entry) {
                    logError('Must supply an entry name');
                    return;
                }

                newEntry = entry;
                hashedFilename = util.hashFilename(entry);

                // This seems counter-intuitive because the resolve and reject operations
                // are reversed, but this is b/c the success case is when the file does not
                // exist (and thus will throw an exception).
                util.fileExists(`${entryDir}/${hashedFilename}`).then(() => {
                    logError('Entry already exists');
                }).catch(() => {
                    inquirer.prompt([{
                        type: 'input',
                        name: 'username',
                        message: 'Enter username:',
                        validate: (input) => {
                            let res = true;

                            if (!input) {
                                logError('Cannot be blank');
                                res = false;
                            }

                            return res;
                        }
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
                        when: (answers) => {
                            return !answers.generatePassword;
                        }
                    }], (answers) => {
                        if (answers.generatePassword) {
                            generatePassphrase(answers.username);
                        } else {
                            makeFileEntry(answers.username, answers.password);
                        }
                    });
                });
            }
        })(),

        edit: (() => {
            function openEditor(file, callback) {
                let editor = env.EDITOR || 'vim',
                    // Note: Requiring json will also auto-parse it.
                    args = require(`./editors/${editor}`);

                // The editor modules will only contain the CLI args
                // so we need to push on the filename.
                args.push(file);

                require('child_process').spawn(editor, args, {
                    stdio: 'inherit'
                }).on('exit', callback);
            }

            return (entry) => {
                let hashedFilename = util.hashFilename(entry),
                    path = `${entryDir}/${hashedFilename}`;

                util.fileExists(path).then(() => {
                    jcrypt(path, null, ['--decrypt'])
                    .then(() => {
                        openEditor(path, () => {
                            // Re-encrypt once done.
                            jcrypt(path, null, util.getGPGArgs())
                            .then(() => {
                                logInfo('Re-encrypting and closing the entry');
                            })
                            .catch(logError);
                        });
                    })
                    .catch(logError);
                }).catch(logError);
            };
        })(),

        generate: () => {
            console.log(diceware.generate());
        },

        get: (entry) => {
            let hashedFilename = util.hashFilename(entry);

            util.fileExists(`${entryDir}/${hashedFilename}`).then((file) => {
                // Pipe to stdout.
                jcrypt.stream(file, null, ['--decrypt'])
                .catch(logError);
            }).catch(logError);
        },

        has: (entry) => {
            let hashedFilename = util.hashFilename(entry);

            util.fileExists(`${entryDir}/${hashedFilename}`).then(() => {
                logInfo('Entry exists');
            }).catch(logError);
        },

        list: () => {
            // TODO
        },

        remove: (() => {
            function remove(file) {
                return new Promise((resolve, reject) => {
                    let shred = require('child_process').spawn('shred', ['--zero', '--remove', file]);

                    shred.on('close', (code) => {
                        if (code !== 0) {
                            reject('Something terrible happened!');
                        } else {
                            resolve('Entry has been removed');
                        }
                    });
                });
            }

            return (entry) => {
                let hashedFilename = util.hashFilename(entry),
                    path = `${entryDir}/${hashedFilename}`;

                util.fileExists(path).then(() => {
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
                            remove(path)
                            .then(logSuccess)
                            .catch(logError);
                        } else {
                            logInfo('No removal');
                        }
                    });
                }).catch(logError);
            };
        })()
    };

    module.exports = Stymie;
})();

