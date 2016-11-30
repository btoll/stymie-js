'use strict';

const R = require('ramda');
const diceware = require('diceware');
const jcrypt = require('jcrypt');
const util = require('./util');

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

            if (!list[key]) {
                return promise(list, key)
                .then(util.encryptAndWrite);
            } else {
                return false;
            }
        });
    }),

    edit: R.curry((promise, key) =>
        jcrypt.decryptFile(keyFile)
        .then(data => {
            const list = JSON.parse(data);
            const entry = list[key];
            let prompts;

            if (entry) {
                prompts = [{
                    type: 'input',
                    name: 'key',
                    message: 'Edit key:',
                    default: key,
                    validate: util.noDuplicates.bind(null, key, list)
                }];

                for (let n of Object.keys(entry)) {
                    prompts.push({
                        type: 'input',
                        name: n,
                        message: `Edit ${n}:`,
                        default: entry[n]
                    });
                }

                return promise(prompts, list, key)
                .then(util.encryptAndWrite);
            } else {
                return false;
            }
        })),

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
        .then(keys => !!JSON.parse(keys)[key]),

    list: () =>
        jcrypt.decryptFile(keyFile)
        .then(keys => Object.keys(JSON.parse(keys)).sort()),

    rm: R.curry((promise, key) =>
        jcrypt.decryptFile(keyFile)
        .then(data => {
            const list = JSON.parse(data);

            if (!list[key]) {
                return false;
            } else {
                return promise(list, key)
                .then(list => {
                    if (list) {
                        return util.encryptAndWrite(list);
                    } else {
                        return false;
                    }
                });
            }
        }))
};

key.ls = key.list;

module.exports = key;

