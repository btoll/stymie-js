/* eslint-disable no-console */

// TODO: are nested .catch()s needed?

(() => {
    'use strict';

    let env = process.env,
        stymieDir = `${env.STYMIE || env.HOME}/.stymie.d`,
        entryDir = `${stymieDir}/s`,
        logError = console.log.bind(console, '[ERROR]'),
        logInfo = console.log.bind(console, '[INFO]'),
        logSuccess = console.log.bind(console, '[SUCCESS]'),
        inquirer = require('inquirer'),
        stymierc, Stymie, crypto, diceware, fs, jcrypt;

    try {
        stymierc = require(`${stymieDir}/stymie.json`);
    } catch (err) {
        logError('It appears that the password file directory and config file needed by stymie is not installed.\n');

        inquirer.prompt([{
            type: 'list',
            name: 'install',
            message: 'Do you wish to install now?:',
            choices: [
                {name: 'Yes', value: true},
                {name: 'No, I\'ll do it myself later.', value: false}
            ]
        }], (answers) => {
            if (!answers.install) {
                logInfo('Run `bash scripts/postinstall.sh` to install.');
            } else {
                require('./lib/install').install();
            }
        });
    }

    crypto = require('crypto');
    diceware = require('diceware');
    fs = require('fs');
    jcrypt = require('jcrypt');

    function fileExists(file) {
        return new Promise((resolve, reject) => {
            fs.stat(`${entryDir}/${file}`, (err) => {
                if (err) {
                    reject('No matching entry');
                } else {
                    resolve(file);
                }
            });
        });
    }

    function getGPGOptions() {
        let arr = ['--encrypt', '-r', stymierc.recipient];

        if (stymierc.armor) {
            arr.push('--armor');
        }

        if (stymierc.sign) {
            arr.push('--sign');
        }

        return arr;
    }

    function hashFilename(file) {
        if (!file) {
            return;
        }

        return crypto.createHash(stymierc.hash).update(file).digest('hex');
    }

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
                jcrypt.stream(formatData(username, password), `${entryDir}/${hashedFilename}`, {
                    gpg: getGPGOptions(),
                    file: {
                        flags: 'w',
                        defaultEncoding: 'utf8',
                        fd: null,
                        mode: 0o0600
                    }
                }, true)
                .then(() => {
                    logSuccess('Entry created');
                })
                .catch(logError);
            }

            return (entry) => {
                if (!entry) {
                    logError('Must supply an entry name');
                    return;
                }

                newEntry = entry;
                hashedFilename = hashFilename(entry);

                // This seems counter-intuitive because the resolve and reject operations
                // are reversed, but this is b/c the success case is when the file does not
                // exist (and thus will throw an exception).
                fileExists(hashedFilename).then(() => {
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
            let file;

            function openEditor(callback) {
                let editor = env.EDITOR || 'vim',
                    args = (editor === 'vim') ?
                        [
                            '-c', ':set nobackup',
                            '-c', ':set nowritebackup',
                            '-c', ':set noswapfile',
                            '-c', ':set noundofile',
                            // Erases all session information when the
                            // file is closed.
                            '-c', ':set bufhidden=wipe',
                            // Auto-closes folds when leaving them.
                            //'-c', 'fcl=all',
                            // Automatically folds indented lines when
                            // the file is opened.
                            // (prying eyes === 'DRAT foiled again')
                            '-c', ':set foldmethod=indent',
                            // Don't display the first line of text
                            // (the username) in the folded text.
                            '-c', ':set foldtext=""',
                            '-c', ':set viminfo=',
                            file
                        ] :
                        [file];

                require('child_process').spawn(editor, args, {
                    stdio: 'inherit'
                }).on('exit', callback);
            }

            return (entry) => {
                let hashedFilename = hashFilename(entry);

                fileExists(hashedFilename).then(() => {
                    file = `${entryDir}/${hashedFilename}`;

                    jcrypt(file, null, ['--decrypt'])
                    .then(() => {
                        openEditor(() => {
                            // Re-encrypt once done.
                            jcrypt(file, null, getGPGOptions())
                            .then(() => {
                                logInfo('Re-encrypting and closing entry');
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
            let hashedFilename = hashFilename(entry);

            fileExists(hashedFilename).then((file) => {
                // Pipe to stdout.
                jcrypt.stream(`${entryDir}/${file}`, null, ['--decrypt']).catch(logError);
            }).catch(logError);
        },

        has: (entry) => {
            let hashedFilename = hashFilename(entry);

            fileExists(hashedFilename).then(() => {
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
                let hashedFilename = hashFilename(entry);

                fileExists(hashedFilename).then(() => {
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
                            remove(`${entryDir}/${hashedFilename}`)
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

