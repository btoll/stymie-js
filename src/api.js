'use strict';

const R = require('ramda');
const diceware = require('diceware');
// const inquirer = require('inquirer');
const jcrypt = require('jcrypt');
// const util = require('./util');

// const logError = util.logError;
// const logInfo = util.logInfo;
const env = process.env;
const keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`;

const key = {
    add: R.curry((promise, key) => {
        if (!key) {
            return Promise.reject('Nothing to do here');
        }

        let list = null;

        return jcrypt.decryptFile(keyFile)
        .then(data => {
            list = JSON.parse(data);

            return list[key] ?
                false :
                promise(list, key);
        });
    }),

//     edit: key =>
//         jcrypt.decryptFile(keyFile)
//         .then(data => {
//             const list = JSON.parse(data);
//             const entry = list[key];
//             let prompts;

//             if (entry) {
//                 prompts = [{
//                     type: 'input',
//                     name: 'key',
//                     message: 'Edit key:',
//                     default: key,
//                     validate: util.noDuplicates.bind(null, key, list)
//                 }];

//                 for (let n of Object.keys(entry)) {
//                     prompts.push({
//                         type: 'input',
//                         name: n,
//                         message: `Edit ${n}:`,
//                         default: entry[n]
//                     });
//                 }

//                 inquirer.prompt(prompts, answers => {
//                     const entry = answers.key;

//                     if (entry !== key) {
//                         // Rename the key.
//                         delete list[key];
//                         list[entry] = {};
//                     }

//                     for (let answer in answers) {
//                         if (answer !== 'key') {
//                             list[entry][answer] = answers[answer];
//                         }
//                     }

//                     answers = getNewFields(entry);
//                 });
//             } else {
//                 logInfo('No matching key');
//             }
//         })
//         .catch(logError),

    generate: () => diceware.generate(),

    get: (key, field) => {
        if (!key) {
            return Promise.reject('Nothing to do here');
        }

        return jcrypt.decryptFile(keyFile)
        .then(data => {
            const list = JSON.parse(data);
            const entry = list[key];

            if (entry) {
                if (!field) {
                    return {
                        key,
                        entry
                    };
                } else {
                    const f = entry[field];

                    if (f) {
                        return f;
                    }
                }
            }

            return false;
        });
    },

    has: key =>
        jcrypt.decryptFile(keyFile)
        .then(data => !!JSON.parse(data)[key]),

    list: () =>
        jcrypt.decryptFile(keyFile)
        .then(keys => Object.keys(JSON.parse(keys)).sort()),

    rm: R.curry((promise, key) =>
        jcrypt.decryptFile(keyFile)
        .then(data => {
            const list = JSON.parse(data);

            return list[key] ?
                promise(list, key) :
                'No matching key';
        }))
};

key.ls = key.list;

module.exports = key;

