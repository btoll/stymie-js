/* eslint-disable no-console */

// TODO: are nested .catch()s needed?

(() => {
    'use strict';

    let fs = require('fs'),
        inquirer = require('inquirer'),
        jcrypt = require('jcrypt'),
        util = require('./util'),
        logError = util.logError,
        logInfo = util.logInfo,
        logSuccess = util.logSuccess,
        env = process.env,
        entryDir = `${env.STYMIE || env.HOME}/.stymie.d/s`,
        Stymie;

    function openEditor(file, callback) {
        let editor = env.EDITOR || 'vim',
            // Note: Requiring json will also auto-parse it.
            args = require(`../editors/${editor}`);

        // The editor modules will only contain the CLI args
        // so we need to push on the filename.
        args.push(file);

        require('child_process').spawn(editor, args, {
            stdio: 'inherit'
        }).on('exit', callback);
    }

    Stymie = {
        add: (entry) => {
            let hashedFilename;

            if (!entry) {
                logError('Must supply a file name');
                return;
            }

            hashedFilename = util.hashFilename(entry);

            // This seems counter-intuitive because the resolve and reject operations
            // are reversed, but this is b/c the success case is when the file does not
            // exist (and thus will throw an exception).
            util.fileExists(`${entryDir}/${hashedFilename}`).then(() => {
                logError('File already exists');
            }).catch(() => {
                jcrypt.stream(entry, `${entryDir}/${hashedFilename}`, {
                    gpg: util.getGPGArgs(),
                    file: {
                        flags: 'w',
                        defaultEncoding: 'utf8',
                        fd: null,
                        mode: 0o0600
                    }
                }, true)
                .then(() => {
                    logSuccess('File created successfully');
                })
                .catch(logError);
            });
        },

        edit: (entry) => {
            let hashedFilename = util.hashFilename(entry),
                path = `${entryDir}/${hashedFilename}`;

            util.fileExists(path).then(() => {
                jcrypt(path, null, ['--decrypt'])
                .then(() => {
                    openEditor(path, () => {
                        // Re-encrypt once done.
                        jcrypt(path, null, util.getGPGArgs())
                        .then(() => {
                            logInfo('Re-encrypting and closing the file');
                        })
                        .catch(logError);
                    });
                })
                .catch(logError);
            }).catch(logError);
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
                logInfo('File exists');
            }).catch(logError);
        },

        remove: (() => {
            function remove(file) {
                return new Promise((resolve, reject) => {
                    let shred = require('child_process').spawn('shred', ['--zero', '--remove', file]);

                    shred.on('close', (code) => {
                        if (code !== 0) {
                            reject('Something terrible happened!');
                        } else {
                            resolve('File has been removed');
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

