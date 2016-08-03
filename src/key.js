'use strict';

const diceware = require('diceware');
const generateEntry = require('./generateEntry');
const inquirer = require('inquirer');
const jcrypt = require('jcrypt');

const util = require('./util');
const log = util.log;
const logError = util.logError;
const logInfo = util.logInfo;
const logRaw = util.logRaw;
const logSuccess = util.logSuccess;
const env = process.env;
const keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`;
const reWhitespace = /\s/g;

const key = {
    add: generateEntry,

    edit: key =>
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data => {
            const list = JSON.parse(data);
            const entry = list[key];
            let prompts, hasChanged;

            if (entry) {
                hasChanged = {
                    changed: false
                };

                prompts = [{
                    type: 'input',
                    name: 'key',
                    message: 'Edit key:',
                    default: key,
                    validate: util.noDuplicates.bind(null, key, list)
                }];

                for (const n in entry) {
                    if (entry.hasOwnProperty(n)) {
                        prompts.push({
                            type: 'input',
                            name: n,
                            message: `Edit ${n}:`,
                            default: entry[n],
                            validate: util.hasChanged.bind(null, hasChanged, n)
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
                        for (const n in answers) {
                            if (answers.hasOwnProperty(n) && n !== 'key') {
                                item[n] = answers[n];
                            }
                        }

                        jcrypt.stream(JSON.stringify(list, null, 4), keyFile, {
                            gpg: util.getGPGArgs(),
                            file: util.getDefaultFileOptions()
                        }, true)
                        .then(() => logSuccess('Key has been updated'))
                        .catch(logError);
                    } else {
                        logInfo('No change');
                    }
                });
            } else {
                logInfo('No matching key');
            }
        })
        .catch(logError),

    generate: () => log(diceware.generate()),

    get: (needle, field) =>
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data => {
            const list = JSON.parse(data);
            const entry = list[needle];

            if (entry) {
                if (!field) {
                    for (const n in entry) {
                        if (entry.hasOwnProperty(n) && n !== 'needle') {
                            logRaw(`${n}: ${key.stripped(entry[n])}`);
                        }
                    }
                } else {
                    const f = entry[field];

                    if (!f) {
                        logError('No field found');
                    } else {
                        // Don't log here b/c we don't want the newline char! This is best when
                        // copying to clipboard, i.e.:
                        //
                        //      stymie get example.com -f password -s | pbcopy
                        //
                        // To view the logged output, get the whole entry (don't specify a `field`).
                        process.stdout.write(key.stripped(f));
                    }
                }
            } else {
                logInfo('No matching key');
            }
        })
        .catch(logError),

    has: key =>
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data =>
            logInfo(
                JSON.parse(data)[key] ?
                    'Key exists' :
                    'No matching key'
            )
        )
        .catch(logError),

    list: () =>
        jcrypt(keyFile, null, ['--decrypt'], true)
        .then(data => {
            const keys = Object.keys(JSON.parse(data));

            logInfo(
                !keys.length ?
                    'No installed keys' :
                    `Installed keys: \n${keys.sort().join('\n')}`
            );
        }),

    rm: key =>
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
        .then(list =>
            jcrypt.stream(JSON.stringify(list, null, 4), keyFile, {
                gpg: util.getGPGArgs(),
                file: util.getDefaultFileOptions()
            }, true)
            .then(() => logSuccess('Key has been removed'))
            .catch(logError)
        )
        .catch(logError),

    // This method is expected to be called immediately with the value of `strip` that was passed
    // on the CLI (see `bin/stymie`). The intent is then to redefine the method with the value of
    // `strip` partially applied.  This will save us from having to always pass through the value
    // of `strip` as a function parameter.
    stripped: strip =>
        key.stripped = field => {
            let f = field;

            if (strip) {
                f = field.replace(reWhitespace, '');
            }

            return f;
        }
};

module.exports = key;

