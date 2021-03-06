'use strict';
const commandLineArgs = require('command-line-args');
const path = require('path');


class CommandLine {
    constructor(definitions) {
        definitions.push({ name: 'help', alias: 'h', type: Boolean });
        this.definitions = definitions;
    }
    
    parse(argv, callback) {
        if (!argv || argv.length == 0) {
            return null;
        }
        let params = commandLineArgs(this.definitions, argv);
        let error = null;
        for (let i = 0; i != this.definitions.length; ++i) {
            let def = this.definitions[i];
            let name = def.name;
            if (name == 'help') {
                continue;
            }
            if (!params.hasOwnProperty(name)) {
                error = name + ' not specified';
                break;
            }
        }
        if (callback) {
            callback(error, params);
        }
        else if (error && !params.help) {
            throw new Error(error);
        }
        return params;
    }
    
    usage() {
        function isOptional(def) {
            return def.name == 'help' || def.hasOwnProperty('defaultValue');
        }
        const progname = path.basename(process.argv[1]);
        let options = ' <options>';
        let getOpts = '';
        this.definitions.forEach(function(def) {
            let opt = '';
            if (isOptional(def)) {
                opt += '\n  [--' + def.name;
                if (def.alias) getOpts += ' [-' + def.alias;
            }
            else {
                opt += '\n  --' + def.name;
                if (def.alias) getOpts += ' -' + def.alias;
            }
            if (def.type !== Boolean) {
                opt += '=<' + def.name + '>';
                if (def.alias) getOpts += ' <' + def.name + '>';
            }
            if (isOptional(def)) {
                opt += ']';
                if (def.alias) getOpts += ']';
            }
            options += opt;
            if (def.help) {
                for (let i = 0; i < (33 - opt.length) / 8; ++i) {
                    options += '\t';
                }
                options += def.help;
                if (def.hasOwnProperty('defaultValue')) {
                    options += ' (default: ' + def.defaultValue + ')';
                }
            }
        });
        return 'Usage:\nnode ' + progname + options + '\nnode ' + progname + getOpts;
    }
}

module.exports = CommandLine;

