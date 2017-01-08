'use strict';

const diceware = require('onf-diceware');
const sillypass = require('sillypass');
const util = require('./util');

const logError = util.logError;

module.exports = {
    add: {
        makePassphrase: [{
            type: 'list',
            name: 'accept',
            message: 'Accept?:',
            choices: [
                {name: 'Yes', value: true},
                {name: 'No, generate another', value: false}
            ]
        }],
        newFields: [{
            type: 'list',
            name: 'createNewField',
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
            when: answers => answers.createNewField
        }, {
            type: 'input',
            name: 'value',
            message: 'Value:',
            validate: util.noBlanks,
            when: answers => answers.createNewField
        }],
        newKey: [{
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
        }]
    },

    bin: [{
        type: 'list',
        name: 'install',
        message: 'Install now?:',
        choices: [
            {name: 'Yes', value: true},
            {name: 'No', value: false}
        ]
    }],

    init: [{
        type: 'input',
        name: 'installDir',
        message: 'Enter directory to install .stymie.d:',
        default: '~'
    }, {
        type: 'input',
        name: 'envFile',
        message: 'We need to export a $STYMIE environment variable.\nName of shell startup file to which the new env var should be written:',
        default: '.bashrc',
        when: answers => answers.installDir !== '~'
    }, {
        type: 'input',
        name: 'recipient',
        message: 'Enter the email address or key ID of your public key:',
        validate: input => {
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
            {name: 'Binary', value: false},
            {name: 'Armored ASCII Text', value: true}
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
        default: '~/.bashrc',
        when: answers => answers.histignore
    }],

    rm: [{
        type: 'list',
        name: 'rm',
        message: 'Are you sure?',
        choices: [
            {name: 'Yes', value: true},
            {name: 'No', value: false}
        ],
        default: false
    }]
};

