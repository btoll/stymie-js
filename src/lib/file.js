// TODO: are nested .catch()s needed?

'use strict';

let inquirer = require('inquirer'),
    cp = require('child_process'),
    which = require('which'),
    jcrypt = require('jcrypt'),
    util = require('./util'),
    logError = util.logError,
    logInfo = util.logInfo,
    logSuccess = util.logSuccess,
    env = process.env,
    keyDir = `${env.STYMIE || env.HOME}/.stymie.d/s`,
    stymie;

function openEditor(file, callback) {
    let editor = env.EDITOR || 'vim',
        // Note: Requiring json will also auto-parse it.
        args = require(`../../editors/${editor}`);

    // The editor modules will only contain the CLI args
    // so we need to push on the filename.
    args.push(file);

    cp.spawn(editor, args, {
        stdio: 'inherit'
    }).on('exit', callback);
}

stymie = {
    add: (key) => {
        let hashedFilename;

        if (!key) {
            logError('Must supply a file name');
            return;
        }

        hashedFilename = util.hashFilename(key);

        // This seems counter-intuitive because the resolve and reject operations
        // are reversed, but this is b/c the success case is when the file does not
        // exist (and thus will throw an exception).
        util.fileExists(`${keyDir}/${hashedFilename}`).then(() => {
            logError('File already exists');
        }).catch(() => {
            jcrypt.stream(key, `${keyDir}/${hashedFilename}`, {
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

    edit: (key) => {
        let hashedFilename = util.hashFilename(key),
            path = `${keyDir}/${hashedFilename}`;

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

    get: (key) => {
        let hashedFilename = util.hashFilename(key);

        util.fileExists(`${keyDir}/${hashedFilename}`).then((file) => {
            // Pipe to stdout.
            jcrypt.stream(file, null, ['--decrypt'])
            .catch(logError);
        }).catch(logError);
    },

    has: (key) => {
        let hashedFilename = util.hashFilename(key);

        util.fileExists(`${keyDir}/${hashedFilename}`).then(() => {
            logInfo('File exists');
        }).catch(logError);
    },

    remove: (() => {
        function remove(file) {
            return new Promise((resolve, reject) => {
                which('shred', err => {
                    let rm;

                    if (err) {
                        logInfo('You\'re OS doesn\`t have the `shred` utility installed, falling back to `rm`...');
                        rm = cp.spawn('rm', [file]);
                    } else {
                        rm = cp.spawn('shred', ['--zero', '--remove', file]);
                    }

                    rm.on('close', (code) => {
                        if (code !== 0) {
                            reject('Something terrible happened!');
                        } else {
                            resolve('The file has been removed');
                        }
                    });
                });
            });
        }

        return (key) => {
            let hashedFilename = util.hashFilename(key),
                path = `${keyDir}/${hashedFilename}`;

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

module.exports = stymie;

