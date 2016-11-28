const inquirer = require('inquirer');
const logger = require('logger');
const prompts = require('./prompts');
const util = require('./util');

const env = process.env;
const keyFile = `${env.STYMIE || env.HOME}/.stymie.d/k`;
const log = logger.log;

function getNewFields(entry, resolve) {
    inquirer.prompt(prompts.add.newFields, answers => {
        if (!answers.createNewField) {
            resolve(entry);
        } else {
            entry[answers.name] = answers.value;
            getNewFields(entry);
        }
    });
}

function makePassphrase(generatePassword, entry, resolve) {
    if (entry.password !== undefined) {
        resolve(entry);
    } else {
        const password = generatePassword.generate();

        log(password);

        inquirer.prompt(prompts.add.makePassphrase, answers => {
            if (answers.accept) {
                entry.password = password;
                resolve(entry);
            } else {
                makePassphrase(generatePassword, entry, resolve);
            }
        });
    }
}

const foo = {
    add: (list, key) =>
        new Promise((resolve, reject) => {
            inquirer.prompt(prompts.add.newKey, answers =>
                makePassphrase(answers.generatePassword, {
                    key: key,
                    url: answers.url,
                    username: answers.username,
                    password: answers.password
                }, resolve, reject)
            );
        }).then(entry => {
            return new Promise((resolve) => {
                getNewFields(entry, resolve);
            }).then(entry => {
                const item = list[entry.key] = {};

                for (let n of Object.keys(entry)) {
                    if (n !== 'key') {
                        item[n] = entry[n];
                    }
                }

                return util.encrypt(JSON.stringify(list, null, 4))
                .then(util.writeFile(keyFile));
            });
        }),

    rm: (list, key) =>
        new Promise((resolve, reject) =>
            inquirer.prompt(prompts.rm, answers => {
                if (answers.rm) {
                    delete list[key];

                    util.encrypt(JSON.stringify(list, null, 4))
                    .then(util.writeFile(keyFile))
                    .then(() => resolve(true))
                    .catch(reject);
                } else {
                    reject(false);
                }
            })
        )
};

module.exports = foo;

