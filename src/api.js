'use strict';

const R = require('ramda');
const diceware = require('diceware');
const jcrypt = require('jcrypt');
const util = require('./util');

const add = R.curry((promise, key) => {
    if (!key) {
        return Promise.reject('Nothing to do here');
    }

    let list = null;

    return jcrypt.decryptFile(util.getKeyFile())
    .then(data => {
        list = JSON.parse(data);

        if (!list[key]) {
            return promise(list, key)
            .then(util.encryptDataToFile);
        } else {
            return false;
        }
    });
});

const edit = R.curry((promise, key) =>
    jcrypt.decryptFile(util.getKeyFile())
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
            .then(util.encryptDataToFile);
        } else {
            return false;
        }
    }));

const generate = () => diceware.generate();

const get = (key, field) => {
    if (!key) {
        return Promise.reject('Nothing to do here');
    }

    return jcrypt.decryptFile(util.getKeyFile())
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
};

const has = key =>
    jcrypt.decryptFile(util.getKeyFile())
    .then(keys => !!JSON.parse(keys)[key]);

const list = () =>
    jcrypt.decryptFile(util.getKeyFile())
    .then(keys => Object.keys(JSON.parse(keys)).sort());

const rm = R.curry((promise, key) =>
    jcrypt.decryptFile(util.getKeyFile())
    .then(data => {
        const list = JSON.parse(data);

        if (!list[key]) {
            return false;
        } else {
            return promise(list, key)
            .then(list =>
                list ?
                    util.encryptDataToFile(list) :
                    false
            );
        }
    }));

module.exports = {
    add,
    edit,
    generate,
    get,
    has,
    list,
    ls: list,
    rm
};

