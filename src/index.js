'use strict';

const api = require('./api');
const injector = require('./injector');

module.exports = {
    add: api.add(injector.add),
    edit: api.edit,
    generate: api.generate,
    get: api.get,
    has: api.has,
    list: api.list,
    ls: api.list,
    rm: api.rm(injector.rm)
};

