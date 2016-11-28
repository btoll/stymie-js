'use strict';

const cp = require('child_process');
const fs = require('fs');
const prompts = require('./prompts');
const inquirer = require('inquirer');
const util = require('./util');

const logError = util.logError;
const logSuccess = util.logSuccess;

module.exports = () =>
    inquirer.prompt(prompts.init, answers => {
        const home = process.env.HOME;
        let installDir = answers.installDir;
        let stymieDir;

        const gpgOptions = {
            armor: !!answers.armor,
            recipient: answers.recipient,
            sign: !!answers.sign
        };

        util.setGPGOptions(gpgOptions);

        if (installDir === '~') {
            installDir = home;
        }

        stymieDir = `${installDir}/.stymie.d`;

        function mkDir(dir) {
            return new Promise((resolve, reject) =>
                fs.mkdir(dir, 0o700, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(dir);
                    }
                })
            );
        }

        mkDir(stymieDir)
        .then(dir => {
            logSuccess(`Created project directory ${dir}`);

            // Create config file.
            return util.encrypt(JSON.stringify(gpgOptions, null, 4))
            .then(util.writeFile(`${stymieDir}/c`))
            .catch(logError);
        })
        .then(file => {
            logSuccess(`Created encrypted config file ${file}`);

            // Create entry list file.
            // TODO: DRY!
            return util.encrypt(JSON.stringify({}, null, 4))
            .then(util.writeFile(`${stymieDir}/k`))
            .catch(logError);
        })
        .then(file => {
            logSuccess(`Created encrypted entries list file ${file}`);

            if (answers.histignore) {
                const histignoreFile = `${home}/${answers.histignoreFile}`;

                return new Promise((resolve, reject) =>
                    fs.appendFile(histignoreFile, 'export HISTIGNORE="stymie *:$HISTIGNORE"\n', 'utf8', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve('Updated $HISTIGNORE');
                        }
                    })
                );
            }
        })
        .then(data => {
            // Note that `data` is undefined if not updating $HISTIGNORE.
            if (data) {
                logSuccess(data);

                // TODO
                // Immediately source the startup file.
                // require('child_process').spawn('source', [histignoreFile]);
            }
        })
        .catch(err => {
            logError(err);
            util.logWarn('Cleaning up, install aborted...');

            // TODO: Shred?
            const rm = cp.spawn('rm', ['-r', '-f', stymieDir]);

            rm.on('close', code => {
                if (code !== 0) {
                    logError('Something terrible happened, the project directory could not be removed!');
                } else {
                    util.logInfo('The project directory has been removed');
                }
            });
        });
    });

