'use strict';

const diceware = require('diceware');
const inquirer = require('inquirer');
const jcrypt = require('jcrypt');
const sillypass = require('sillypass');
const util = require('./util');

const log = util.log;
const logError = util.logError;
const logInfo = util.logInfo;
const logSuccess = util.logSuccess;
const env = process.env;
const keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`;
let iter;

function* generateEntry(key) {
    let entry = yield getNewKeyInfo(key);
    entry = yield getNewFields(entry);
    yield makeEntry(entry);
}

function getNewFields(entry) {
    inquirer.prompt(util.getNewFieldsPrompts(), answers => {
        if (!answers.createNewField) {
            iter.next(entry);
        } else {
            entry[answers.name] = answers.value;
            getNewFields(entry);
        }
    });
}

function getNewKeyInfo(key) {
    jcrypt.decryptFile(keyFile)
    .then(data => {
        const list = JSON.parse(data);

        if (list[key]) {
            logInfo('Key already exists');
        } else {
            inquirer.prompt([{
                type: 'input',
                name: 'url',
                message: 'Enter url:',
                validate: util.noBlanks
            }, {
                type: 'input',
                name: 'username',
                message: 'Enter username:',
                validate: util.noBlanks
            }, {
                type: 'list',
                name: 'generatePassword',
                message: 'Password generation method:',
                default: false,
                choices: [
                    {name: 'Diceware (passphrase)', value: diceware},
                    {name: 'Sillypass (mixed-case, alphanumeric, random characers)', value: sillypass},
                    {name: 'I\'ll generate it myself', value: 'custom'}
                ]
            }, {
                type: 'password',
                name: 'password',
                message: 'Enter password:',
                validate: util.noBlanks,
                when: answers => answers.generatePassword === 'custom'
            }], answers =>
                makePassphrase(answers.generatePassword, {
                    key: key,
                    url: answers.url,
                    username: answers.username,
                    password: answers.password
                })
            );
        }
    })
    .catch(logError);
}

function makeEntry(entry) {
    jcrypt.decryptFile(keyFile)
    .then(data => {
        const list = JSON.parse(data);
        const item = list[entry.key] = {};

        for (let n of Object.keys(entry)) {
            if (n !== 'key') {
                item[n] = entry[n];
            }
        }

        return jcrypt.encrypt(util.getGPGArgs(), JSON.stringify(list, null, 4))
        .then(util.writeFile(util.getDefaultFileOptions(), keyFile));
    })
    .then(() => logSuccess('Entry created successfully'))
    .catch(logError);
}

function makePassphrase(generatePassword, entry) {
    if (entry.password !== undefined) {
        iter.next(entry);
    } else {
        const password = generatePassword.generate();

        log(password);

        inquirer.prompt([{
            type: 'list',
            name: 'accept',
            message: 'Accept?:',
            choices: [
                {name: 'Yes', value: true},
                {name: 'No, generate another', value: false}
            ]
        }], answers => {
            if (answers.accept) {
                entry.password = password;
                iter.next(entry);
            } else {
                makePassphrase(generatePassword, entry);
            }
        });
    }
}

module.exports = key => {
    if (!key) {
        logError('No key name');
        return;
    }

    iter = generateEntry(key);
    iter.next();
};

