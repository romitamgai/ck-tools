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
        for (let i = 0; i != this.definitions.length; ++i) {
            let def = this.definitions[i];
            const name = def.name;
            if (name == 'help') return true;
            if (!params[name]) {
                callback(name + ' not specified', params);
                return;
            }
        }
        callback(null, params);
        return params;
    }
    
    usage() {
        const progname = path.basename(process.argv[1]);
        let options = '';
        let getOpts = '';
        this.definitions.forEach(function(def) {
            if (def.name == 'help' || def.defaultValue) {
                options += ' [--' + def.name;
                getOpts += ' [-' + def.alias;
            }
            else {
                options += ' --' + def.name;
                getOpts += ' -' + def.alias;
            }
            if (def.type !== Boolean) {
                options += '=<' + def.name + '>';
                getOpts += ' <' + def.name + '>';
            }
            if (def.name == 'help' || def.defaultValue) {
                options += ']';
                getOpts += ']';
            }
        });
        return 'Usage:\nnode ' + progname + options + '\nnode ' + progname + getOpts;
    }
}

module.exports = CommandLine;

