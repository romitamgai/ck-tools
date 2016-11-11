// Extract product definitions from Excel file
'use strict';
const assert = require('assert');

const xlsx = require('xlsx');
const SheetProcessor = require('./sheet-processor');

// Global variables
const global = {
    docs: [],
    workgroups: []
};

// Parse command line
const CmdLineSpec = require('../command-line');
const cmdLineSpec = new CmdLineSpec([
    { name: 'file', alias: 'f', type: String },
    { name: 'locale', alias: 'l', type: String, defaultValue: 'en-CA' },
    { name: 'sheet', alias: 's', type: String, defaultValue: 'Sheet1' },
    { name: 'workgroups', alias: 'w', type: Boolean, defaultValue: false },
]);
const args = validateArgs(cmdLineSpec.parse(process.argv));

// Open worksheet
const workbook = xlsx.readFile(args.file);
const sheet = workbook.Sheets[args.sheet];
if (!sheet) {
    throw new Error('sheet not found: ' + args.sheet);
}
const sheetProcessor = new SheetProcessor(sheet);

// Process cells in sheet
sheetProcessor.forEachCell(function(col, row, nextRow, rowComplete) {
    let cell = sheetProcessor.sheet[col + row];
    if (row == sheetProcessor.firstRow) {
        // assume first row has the titles
        if (!global.prop) {
            global.prop = [];
        }
        if (cell) {
            global.prop[col] = cell.v;
        }
        return;
    }
    cell = findCellValue(sheetProcessor.sheet, col, row, nextRow);
    if (!global.doc) {
        global.doc = {};
    }
    let prop = global.prop[col];
    global.doc[prop] = cell? cell.v : cell; 
    if (rowComplete) {
        let temp = JSON.parse(JSON.stringify(global.doc));
        if (Object.keys(temp) != 0) {
            global.docs.push(temp);
        }
        global.doc = {};
    }
});

if (args.workgroups) {
    generateWorkgroupMappings(args);
}
else {
    console.log(JSON.stringify(global.docs, null, 4));
}


// Helper functions:

// Hack for lazy formatting in instructional programs file:
// assume that if a classification is not found in the row,
// then we should apply the previous that we've seen.

function findCellValue(sheet, col, row, nextRow) {
    let cell = sheet[col + row];
    while (!cell && row < nextRow) {
        ++row;
        cell = sheet[col + row];
    }
    if (global.prop[col] == 'CK Classification') {
        if (!cell) cell = global.prev;
        global.prev = cell;
    }
    return cell;
}


function validateArgs(args) {
    const fs = require('fs');
    const path = require('path');

    if (!path.isAbsolute(args.file)) {
        args.file = path.join(__dirname, args.file);
    }
    try {
        let stat = fs.statSync(args.file);
        if (!stat.isFile()) {
            throw new Error('not a regular file: ' + args.file);
        }
    }
    catch (err) {
        throw new Error(err.message);
    }
    return args;
}


// CK-specific stuff:

function addInstructionalProgram(ckwg, ip) {
    assert.equal(ip['CK Classification'], ckwg.classificationNumber);
    const title = ip['Program of Study Title'];
    let instructionalProgram = global.dict[title];
    if (instructionalProgram) {
        instructionalProgram.campuses.push({
            name: ip['Campus'],
            url: ip['URL'],
        });
    }
    else { 
        const index = +ckwg.instructionalPrograms.length + 1;
        instructionalProgram = {
            id: 'ckip.' + ckwg.locale[0].country + '.' + ckwg.locale[0].language 
                + '-' + ckwg.classificationNumber + '-' + index,
            name: title,
            description: ip['Description'],
            campuses: [ {
                name: ip['Campus'],
                url: ip['URL'],
            } ]
        };
        global.dict[title] = instructionalProgram;
        ckwg.instructionalPrograms.push(instructionalProgram);
    }
}


function addWorkgroup(loc, programsByClassification, w) {
    const classification = w['Classification #'];
    const instructionalPrograms = programsByClassification[classification];
    if (!instructionalPrograms) {
        return;
    }
    let ckwg = {
        locale: [ { country: loc.country, language: loc.language } ],
        title: w['Work Group Title'],
        personalityType: w['Personality type'],
        classificationNumber: classification,
        entity: 'ckwg',
        id: 'ckwg.' + loc.country + '.' + loc.language + '.' + classification,
        instructionalPrograms: []
    };
    global.dict = []; // for consolidating instructional programs by title (name)
    instructionalPrograms.forEach(addInstructionalProgram.bind(null, ckwg));
    global.workgroups.push(ckwg);
}


function generateWorkgroupMappings(args) {
    const programsByClassification = instructionalProgramsByClassification();

    const Locale = require('locale').Locale;
    const loc = new Locale(args.locale);

    const workgroups = require('./ck-workgroups.json');
    workgroups.forEach(addWorkgroup.bind(null, loc, programsByClassification));
    console.log(JSON.stringify(global.workgroups, null, 4));
}


function instructionalProgramsByClassification() {
    let groups = {};
    global.docs.forEach(function(ip) {
        const classification = ip['CK Classification'];
        if (!groups[classification]) {
            groups[classification] = [];
        }
        groups[classification].push(ip);
    });
    return groups;
}

