const assert = require('assert');
const CommandLine = require('..');


describe('CommandLine', function() {
    setup(function() {
        commandLine = new CommandLine([
            { name: 'encoding', alias: 'e', type: String, defaultValue: 'utf8' },
            { name: 'file', alias: 'f', type: String },
        ])
    })

    describe('#constructor', function() {
        it ('should be valid', function() {
            assert(commandLine instanceof CommandLine);

            // --help is automatically added, so expect 3 defs:
            assert.equal(commandLine.definitions.length, 3);
        })
    })

    describe('#parse()', function() {
        it ('should return null', function() {
            assert.equal(commandLine.parse(), null);
            assert.equal(commandLine.parse([]), null);
        })
    })
    
    describe('#parse missing argument', function() {
        it ('should emit error', function() {
            commandLine.parse([ '-e', 'utf16' ], function(err, params) {
                assert.equal(err, 'file not specified');
                assert.deepEqual(params, { encoding: 'utf16' });
            })
        })
    })
    
    describe('#parse missing callback', function() {
        it ('should treat callback as optional', function() {
            assert.throws(function() {
                commandLine.parse([ '-h' ])
            }, Error);
            assert.doesNotThrow(function() {
                commandLine.parse([ '--file=foo' ]);
            })
        })
    })
    
    describe('#usage()', function() {
        it ('should return expected usage message', function() {
            const usage = 'Usage:\nnode _mocha [--encoding=<encoding>] --file=<file> [--help]'
                + '\nnode _mocha [-e <encoding>] -f <file> [-h]';
            assert.equal(commandLine.usage(), usage);
        })
    })
})

