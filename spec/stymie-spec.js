/* eslint-disable no-console */

'use strict';

const injector = require('./helpers/injector');
const stymie = require('../src/api');
const util = require('../src/util');

const keyName = 'utley';

describe('stymie', () => {
    beforeAll(() => util.setGPGOptions({
        armor: false,
        recipient: 'EF822A3A',
        sign: true
    }));

    describe('#add', () => {
        it('should reject when no key name is given', done =>
            stymie.add(injector.add, '')
            .catch(err => {
                expect(err).toBe('Nothing to do here');
                done();
            })
        );

        it('should add a new key', done =>
            stymie.add(injector.add, keyName)
            .then(() =>
                stymie.has(keyName)
                .then(res => {
                    expect(res).toBe(true);
                    done();
                })
            )
        );

        it('should not add a duplicate key', done =>
            stymie.add(injector.add, keyName)
            .then(res => {
                expect(res).toBe(false);
                done();
            })
        );
    });

    // TODO
    describe('#edit', () => {
        it('should derp', done => {
            stymie.edit(injector.edit, keyName)
            .then(() => {
                // TODO
                expect(true).toBe(true);
                done();
            });
        });
    });

    describe('#generate', () => {
        it('should generate a passphrase', () =>
            expect(typeof stymie.generate()).toBe('string')
        );
    });

    describe('#get', () => {
        it('should reject when no key name is given', () =>
            stymie.get()
            .catch(err => {
                expect(err).toBe('Nothing to do here');
            })
        );

        describe('getting a key', () => {
            it('should be a no-op when a non-existing key is given', done =>
                stymie.get('derp')
                .then(res => {
                    expect(res).toBe(false);
                    done();
                })
            );

            it('should return the key values for an existing key', done =>
                stymie.get('utley')
                .then(res => {
                    expect(res.entry).toEqual({
                        url: 'http://www.benjamintoll.com/',
                        username: 'utley',
                        password: 'foo'
                    });
                    done();
                })
            );
        });

        describe('getting a field', () => {
            it('should be a no-op when the field does not exist', done =>
                stymie.get('utley', 'bar')
                .then(res => {
                    expect(res).toBe(false);
                    done();
                })
            );

            it('should return the field value for an existing field', done =>
                stymie.get('utley', 'password')
                .then(res => {
                    expect(res).toBe('foo');
                    done();
                })
            );
        });
    });

    describe('#has', () => {
        it('should return true when the key exists', done =>
            stymie.has(keyName)
            .then(res => {
                expect(res).toBe(true);
                done();
            })
        );

        it('should return false when the key does not exist', done =>
            stymie.has('i am a bogus key name')
            .then(res => {
                expect(res).toBe(false);
                done();
            })
        );
    });

    describe('listing keys', () => {
        const spec = (funcName, done) =>
            stymie[funcName]()
            .then(keys => {
                expect(keys.length).toBe(1);
                expect(keys[0]).toBe(keyName);
                done();
            });

        it('#list should list all keys', done =>
            spec('list', done)
        );

        it('#ls should be an alias of #list', done =>
            spec('ls', done)
        );
    });

    describe('#rm', () => {
        it('should be a no-op on a non-existing key', done =>
            stymie.rm(injector.rm, 'i do not exist')
            .then(data => {
                expect(data).toBe(false);
                done();
            })
        );

        it('should not remove an existing key if selecting `No`', done =>
            stymie.rm(injector.rm(2), keyName)
            .then(() =>
                stymie.has(keyName)
                .then(res => {
                    expect(res).toBe(true);
                    done();
                })
            )
        );

        it('should remove an existing key if selecting `Yes`', done =>
            stymie.rm(injector.rm(1), keyName)
            .then(() =>
                stymie.has(keyName)
                .then(res => {
                    expect(res).toBe(false);
                    done();
                })
            )
        );
    });
});

