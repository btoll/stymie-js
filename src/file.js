'use strict';

const fs = require('fs');
const inquirer = require('inquirer');
const cp = require('child_process');
const which = require('which');
const jcrypt = require('jcrypt');
const util = require('./util');
const logError = util.logError;
const logInfo = util.logInfo;
const logSuccess = util.logSuccess;
const env = process.env;
const cwd = process.cwd();
const fileDir = `${env.STYMIE || env.HOME}/.stymie.d/s`;
const treeFile = `${env.STYMIE || env.HOME}/.stymie.d/t`;

function openEditor(file, callback) {
    const editor = env.EDITOR || 'vim';
    const args = require(`${cwd}/editors/${editor}`);

    // The editor modules will only contain the CLI args so we need to push on the filename.
    args.push(file);

    cp.spawn(editor, args, {
        stdio: 'inherit'
    }).on('exit', callback);
}

const file = {
    add: key => {
        if (!key) {
            logError('Must supply a file name');
            return;
        }

        const hashedFilename = util.hashFilename(key);

        // This seems counter-intuitive because the resolve and reject operations
        // are reversed, but this is b/c the success case is when the file does not
        // exist (and thus will throw an exception).
        util.fileExists(`${fileDir}/${hashedFilename}`)
        .then(() => logError('File already exists'))
        .catch(() =>
            jcrypt.stream(key, `${fileDir}/${hashedFilename}`, {
                gpg: util.getGPGArgs(),
                file: {
                    flags: 'w',
                    defaultEncoding: 'utf8',
                    fd: null,
                    mode: 0o0600
                }
            }, true)
            // Now that the new file has been added we need to record it in the "treefile"
            // in order to do lookups.
            // For example:
            //
            //      hashedFilename => plaintext
            //
            .then(() => {
                jcrypt(treeFile, null, ['--decrypt'], true)
                .then(data => {
                    const list = JSON.parse(data);

                    list[hashedFilename] = key;

                    jcrypt.stream(JSON.stringify(list, null, 4), treeFile, {
                        gpg: util.getGPGArgs(),
                        file: {
                            flags: 'w',
                            defaultEncoding: 'utf8',
                            fd: null,
                            mode: 0o0600
                        }
                    }, true);
                });
            })
            .then(() => logSuccess('File created successfully'))
            .catch(logError)
        );
    },

    edit: key => {
        const hashedFilename = util.hashFilename(key);
        const path = `${fileDir}/${hashedFilename}`;

        util.fileExists(path).then(() =>
            jcrypt(path, null, ['--decrypt'])
            .then(() =>
                openEditor(path, () =>
                    // Re-encrypt once done.
                    jcrypt(path, null, util.getGPGArgs())
                    .then(() => logInfo('Re-encrypting and closing the file'))
                    .catch(logError)
                )
            )
            .catch(logError)
        )
        .catch(logError);
    },

    get: key => {
        const hashedFilename = util.hashFilename(key);

        util.fileExists(`${fileDir}/${hashedFilename}`)
        .then(file =>
            // Pipe to stdout.
            jcrypt.stream(file, null, ['--decrypt'])
            .catch(logError)
        )
        .catch(logError);
    },

    has: key => {
        const hashedFilename = util.hashFilename(key);

        util.fileExists(`${fileDir}/${hashedFilename}`)
        .then(() => logInfo('File exists'))
        .catch(logError);
    },

    list: () => {
        let list;

        jcrypt(treeFile, null, ['--decrypt'], true)
        .then(data => {
            list = JSON.parse(data);

            fs.readdir(fileDir, (err, files) => {
                if (!files.length) {
                    util.logInfo('No files');
                } else {
                    files.forEach(file => logInfo(list[file]));
                }
            });
        });
    },

    rm: (() => {
        function rm(file) {
            return new Promise((resolve, reject) =>
                which('shred', err => {
                    let rm;

                    if (err) {
                        logInfo('Your OS doesn\`t have the `shred` utility installed, falling back to `rm`...');
                        rm = cp.spawn('rm', [file]);
                    } else {
                        rm = cp.spawn('shred', ['--zero', '--remove', file]);
                    }

                    rm.on('close', code => {
                        if (code !== 0) {
                            reject('Something terrible happened!');
                        } else {
                            resolve('The file has been removed');
                        }
                    });
                })
            );
        }

        return key => {
            const hashedFilename = util.hashFilename(key);
            const path = `${fileDir}/${hashedFilename}`;

            util.fileExists(path)
            .then(() =>
                inquirer.prompt([{
                    type: 'list',
                    name: 'rm',
                    message: 'Are you sure?',
                    choices: [
                        {name: 'Yes', value: true},
                        {name: 'No', value: false}
                    ]
                }], answers => {
                    if (answers.rm) {
                        rm(path)
                        .then(logSuccess)
                        .catch(logError);
                    } else {
                        logInfo('No removal');
                    }
                })
            )
            .catch(logError);
        };
    })()
};

module.exports = file;

