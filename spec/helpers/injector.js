const R = require('ramda');
const inquirer = require('inquirer');
const prompts = require('../../src/prompts');

const promptModule = inquirer.createPromptModule();

const foo = {
    add: (list, key) => {
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

        return {
            list,
            key,
            answers: newKeyPromise.answers
        };
    },

    rm: R.curry((selection, list, key) => {
        const promise = promptModule(prompts.rm);

        // Select `Yes` or `No` when prompted to remove.
        promise.rl.input.emit('keypress', (selection).toString());
        promise.rl.emit('line');

        return {
            selection,
            list,
            key,
            answers: promise.answers
        };
    })
};

module.exports = foo;

