'use strict';

let diceware = require('diceware'),
    inquirer = require('inquirer'),
    jcrypt = require('jcrypt'),
    util = require('./util'),
    log = util.log,
    logError = util.logError,
    logInfo = util.logInfo,
    logSuccess = util.logSuccess,
    env = process.env,
    keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`,
    iter;

function* generateKey(key) {
    let entry = yield getCredentials(key);
    entry = yield getFields(entry);
    yield makeKey(entry);
}

function makePassphrase(entry) {
    if (entry.password !== undefined) {
        iter.next(entry);
    } else {
        let password = diceware.generate();

        log(password);

        inquirer.prompt([{
            type: 'list',
            name: 'accept',
            message: 'Accept?:',
            choices: [
                {name: 'Yes', value: true},
                {name: 'No, generate another', value: false}
            ]
        }], (answers) => {
            if (answers.accept) {
                entry.password = password;
                iter.next(entry);
            } else {
                makePassphrase(entry);
            }
        });
    }
}

function getCredentials(key) {
    jcrypt(keyFile, null, ['--decrypt'], true)
    .then((data) => {
        let list = JSON.parse(data);

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
                validate: util.noBlanks,
                when: (answers) => {
                    return !answers.generatePassword;
                }
            }], (answers) => {
                makePassphrase({
                    key: key,
                    url: answers.url,
                    username: answers.username,
                    password: answers.password
                });
            });
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
        validate: util.noBlank,
        when: (answers) => {
            return answers.newField;
        }
    }, {
        type: 'input',
        name: 'value',
        message: 'Value:',
        validate: util.noBlank,
        when: (answers) => {
            return answers.newField;
        }
    }], (answers) => {
        if (!answers.newField) {
            iter.next(entry);
        } else {
            entry[answers.name] = answers.value;
            getFields(entry);
        }
    });
}

function makeKey(entry) {
    jcrypt(keyFile, null, ['--decrypt'], true)
    .then((data) => {
        let list = JSON.parse(data),
            item;

        item = list[entry.key] = {};

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
    .then(() => {
        logSuccess('Key created successfully');
    })
    .catch(logError);
}

module.exports.make = (key) => {
    iter = generateKey(key);
    iter.next();
};

