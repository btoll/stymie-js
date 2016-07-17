'use strict';

const diceware = require('diceware');
const sillypass = require('sillypass');
const inquirer = require('inquirer');
const jcrypt = require('jcrypt');
const util = require('./util');
const log = util.log;
const logError = util.logError;
const logInfo = util.logInfo;
const logSuccess = util.logSuccess;
const env = process.env;
const keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`;
let iter;

function* generateEntry(key) {
    let entry = yield getCredentials(key);
    entry = yield getFields(entry);
    yield makeEntry(entry);
}

function makePassphrase(method, entry) {
    if (entry.password !== undefined) {
        iter.next(entry);
    } else {
        const password = method.generate();

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
                makePassphrase(method, entry);
            }
        });
    }
}

function getCredentials(key) {
    jcrypt(keyFile, null, ['--decrypt'], true)
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

function getFields(entry) {
    inquirer.prompt([{
        type: 'list',
        name: 'newField',
        message: 'Create another field?:',
        choices: [
            {name: 'Yes', value: true},
            {name: 'No', value: false}
        ]
    }, {
        type: 'input',
        name: 'name',
        message: 'Name:',
        validate: util.noBlanks,
        when: answers => answers.newField
    }, {
        type: 'input',
        name: 'value',
        message: 'Value:',
        validate: util.noBlanks,
        when: answers => answers.newField
    }], answers => {
        if (!answers.newField) {
            iter.next(entry);
        } else {
            entry[answers.name] = answers.value;
            getFields(entry);
        }
    });
}

function makeEntry(entry) {
    jcrypt(keyFile, null, ['--decrypt'], true)
    .then(data => {
        const list = JSON.parse(data);
        const item = list[entry.key] = {};

        // TODO: Iterator.
        for (let n in entry) {
            if (entry.hasOwnProperty(n) && n !== 'key') {
                item[n] = entry[n];
            }
        }

        return jcrypt.stream(JSON.stringify(list, null, 4), keyFile, {
            gpg: util.getGPGArgs(),
            file: {
                flags: 'w',
                defaultEncoding: 'utf8',
                fd: null,
                mode: 0o0600
            }
        }, true);
    })
    .then(() => logSuccess('Entry created successfully'))
    .catch(logError);
}

module.exports = key => {
    if (!key) {
        logError('No key name');
        return;
    }

    iter = generateEntry(key);
    iter.next();
};

