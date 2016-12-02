const R = require('ramda');
const inquirer = require('inquirer');
const prompts = require('../../src/prompts');

const promptModule = inquirer.createPromptModule();

const rm = R.curry((selection, list, key) =>
    new Promise((resolve) => {
        const promise = promptModule(prompts.rm);

        // Select `Yes` or `No` when prompted to remove.
        promise.rl.input.emit('keypress', (selection).toString());
        promise.rl.emit('line');

        if (promise.answers.rm) {
            delete list[key];
            resolve(list);
        } else {
            resolve(false);
        }
    }
));

const add = (list, key) =>
    new Promise(resolve => {
        const newKeyPromise = promptModule(prompts.add.newKey);

        // Url.
        newKeyPromise.rl.emit('line', 'http://www.benjamintoll.com/');
        // Username.
        newKeyPromise.rl.emit('line', key);
        // Select custom password.
        newKeyPromise.rl.input.emit('keypress', '3');
        newKeyPromise.rl.emit('line');
        // Password.
        newKeyPromise.rl.emit('line', 'foo');

        const newFieldsPromise = promptModule(prompts.add.newFields);

        // No new fields.
        newFieldsPromise.rl.input.emit('keypress', '2');
        newFieldsPromise.rl.emit('line');

        // Remove this property so it's not include when we iterate over the answers object.
        delete newKeyPromise.answers.generatePassword;

        list[key] = newKeyPromise.answers;
        resolve(list);
    });

const edit = (prompts, list) =>
    new Promise(resolve => {
        const editPromise = promptModule(prompts);

        // Key.
        editPromise.rl.emit('line');
        // Url.
        editPromise.rl.emit('line');
        // Username.
        editPromise.rl.emit('line');
        // Password.
        editPromise.rl.emit('line', 'goo');

//             const newFieldsPromise = promptModule(prompts.add.newFields);

//             // No new fields.
//             newFieldsPromise.rl.input.emit('keypress', '2');
//             newFieldsPromise.rl.emit('line');

       resolve(list);
    });

module.exports = {
    add,
    edit,
    rm
};

