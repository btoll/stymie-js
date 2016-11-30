const inquirer = require('inquirer');
const logger = require('logger');
const prompts = require('./prompts');

const log = logger.log;
const reWhitespace = /\s/g;

function getNewFields(entry) {
    inquirer.prompt(prompts.add.newFields, answers => {
        if (!answers.createNewField) {
//             resolve(entry);
            return entry;
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
                // TODO: Be able to determine what type of password was selected and only strip
                // whitespace for Diceware passwords.
                // Note: The words in Diceware passwords are delimited by spaces.
                entry.password = password.replace(reWhitespace, '');
                resolve(entry);
            } else {
                makePassphrase(generatePassword, entry, resolve);
            }
        });
    }
}

const injector = {
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
                resolve(getNewFields(entry));
            }).then(entry => {
                const item = list[entry.key] = {};

                for (let n of Object.keys(entry)) {
                    if (n !== 'key') {
                        item[n] = entry[n];
                    }
                }

                return list;
            });
        }),

    edit: (prompts, list, key) =>
        new Promise(resolve =>
            inquirer.prompt(prompts, answers => {
                const newKey = answers.key;

                if (newKey !== key) {
                    // Rename the key.
                    delete list[key];
                    list[newKey] = {};
                }

                for (let answer in answers) {
                    if (answer !== 'key') {
                        list[newKey][answer] = answers[answer];
                    }
                }

                // TODO
//                 answers = getNewFields(list[newKey]);
                resolve(list);
            })
        ),

    rm: (list, key) =>
        new Promise((resolve) =>
            inquirer.prompt(prompts.rm, answers => {
                if (answers.rm) {
                    delete list[key];
                    resolve(list);
                } else {
                    resolve(false);
                }
            })
        )
};

module.exports = injector;

