/* eslint-disable no-console */

(() => {
    'use strict';

    let logError = console.log.bind(console, '[ERROR]'),
        logSuccess = console.log.bind(console, '[SUCCESS]');

    module.exports.install = () => {
        require('inquirer').prompt([{
            type: 'input',
            name: 'installDir',
            message: 'Enter directory to install .stymie.d:',
            default: '~'
        }, {
            type: 'input',
            name: 'envFile',
            message: 'We need to export a $STYMIE environment variable.\nName of shell startup file to which the new env var should be written:',
            default: '.bashrc',
            when: (answers) => {
                return answers.installDir !== '~';
            }
        }, {
            type: 'input',
            name: 'recipient',
            message: 'Enter the email address or key ID of your public key:',
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
            name: 'armor',
            message: 'Select how GPG/PGP will encrypt the password files:',
            choices: [
                {name: 'Armored ASCII Text', value: true},
                {name: 'Binary', value: false}
            ],
            default: false
        }, {
            type: 'list',
            name: 'sign',
            message: 'Should GPG/PGP also sign the password files? (Recommended):',
            choices: [
                {name: 'Yes', value: true},
                {name: 'No', value: false}
            ],
            default: true
        }, {
            type: 'input',
            name: 'hash',
            message: 'What hashing algorithm should be used for the password filenames?',
            default: 'sha256WithRSAEncryption'
        }, {
            type: 'list',
            name: 'histignore',
            message: 'Should "stymie *" be prepended to the value of $HISTIGNORE?',
            choices: [
                {name: 'Yes', value: true},
                {name: 'No', value: false}
            ],
            default: true
        }, {
            type: 'input',
            name: 'histignoreFile',
            message: 'We need to write the new $HISTIGNORE value.\nName of shell startup file to which it should be written:',
            default: '.bashrc',
            when: (answers) => {
                return answers.histignore;
            }
        }], (answers) => {
            let fs = require('fs'),
                installDir = answers.installDir,
                home = process.env.HOME,
                stymieDir;

                if (installDir === '~') {
                    installDir = home;
                }

                stymieDir = `${installDir}/.stymie.d`;

            function mkDir(d) {
                return new Promise((resolve, reject) => {
                    fs.mkdir(d, 0o700, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            // Pass in the location of the next dir to make.
                            resolve(`${stymieDir}/s`);
                        }
                    });
                });
            }

            mkDir(stymieDir)
            .then(mkDir)
            .then(() => {
                return new Promise((resolve, reject) => {
                    let writable = fs.createWriteStream(`${stymieDir}/stymie.json`, {
                        flags: 'w',
                        mode: 0o500
                    });

                    writable.write(JSON.stringify({
                        armor: answers.armor,
                        hash: answers.hash,
                        recipient: answers.recipient,
                        sign: answers.sign
                    }, null, 4), 'utf8', () => {
                        resolve(`Created ${stymieDir} password file directory and config file`);
                    });

                    writable.end(reject);
                });
            })
            .then(logSuccess)
            .catch(logError);

            if (answers.histignore) {
                let histignoreFile = `${home}/${answers.histignoreFile}`;

                return new Promise((resolve, reject) => {
                    fs.appendFile(histignoreFile, 'export HISTIGNORE="stymie *:$HISTIGNORE"', 'utf8', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve('Updated $HISTIGNORE');
                        }
                    });
                })
                .then((data) => {
                    // TODO
                    // Immediately source the startup file.
                    //require('child_process').spawn('source', [histignoreFile]);

                    logSuccess(data);
                })
                .catch(logError);
            }
        });
    };
})();

