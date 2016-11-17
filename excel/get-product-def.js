// Extract product definitions from Excel file
'use strict';
var ckCampus = 'Campus';
var ckClassification = 'CK';
var ckDescription = 'Program Description';
var ckURL = 'Program Page URL';
var ckTitle = 'Program Title';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const uuid = require('node-uuid');

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
    { name: 'cip', alias: 'c', type: Boolean, defaultValue: false, help: 'Generate CIP UUIDs' },
    { name: 'file', alias: 'f', type: String, help: 'Specify input Excel file' },
    { name: 'locale', alias: 'l', type: String, defaultValue: 'en-CA', help: 'Locale to output' },
    { name: 'sheet', alias: 's', type: String, defaultValue: 'Sheet1', help: 'Which sheet to use' },
    { name: 'workgroups', alias: 'w', type: Boolean, defaultValue: false, help: 'Generate workgroup and mappings' },
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
    const Locale = require('locale').Locale;
    const loc = new Locale(args.locale);
    try {
        fs.mkdirSync(loc.normalized);
    }
    catch (e) {
        if (e.code != 'EEXIST') throw e;
    }
    const workgroups = require('./ck-workgroups.json');
    generateWorkgroupMappings(workgroups, loc);
    writeWorkgroups(workgroups, loc);
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
    if (global.prop[col] == ckClassification) {
        if (!cell) cell = global.prev;
        global.prev = cell;
    }
    return cell;
}


function validateArgs(args) {
    if (args.help) {
        console.log(cmdLineSpec.usage());
        process.exit(0);
    }
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
    assert.equal(ip[ckClassification], ckwg.classificationNumber);
    const title = ip[ckTitle].trim();
    let instructionalProgram = global.dict[title];
    if (instructionalProgram) {
        instructionalProgram.campuses.push({
            name: ip[ckCampus].trim(),
            url: ip[ckURL].trim(),
        });
    }
    else { 
        const index = +ckwg.instructionalPrograms.length + 1;
        instructionalProgram = {
            id: 'ckip.' + ckwg.locale[0].country + '.' + ckwg.locale[0].language 
                + '-' + ckwg.classificationNumber + '-' + index,
            name: title,
            description: ip[ckDescription].trim(),
            campuses: [ {
                name: ip[ckCampus].trim(),
                url: ip[ckURL].trim(),
            } ]
        };
        // automatically generate cip info?
        if (args.cip) {
            instructionalProgram.cipName = instructionalProgram.name + '.';
            instructionalProgram.cipCode = uuid.v4();
        }
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
        careers: [],
        instructionalPrograms: []
    };
    global.dict = []; // for consolidating instructional programs by title (name)
    instructionalPrograms.forEach(addInstructionalProgram.bind(null, ckwg));
    global.workgroups.push(ckwg);
}


function generateWorkgroupMappings(workgroups, loc) {
    const programsByClassification = instructionalProgramsByClassification();
    workgroups.forEach(addWorkgroup.bind(null, loc, programsByClassification));
    if (args.cip) {
        generateSchoolInfo(loc);
    }    
    const data = JSON.stringify(global.workgroups, null, 4);
    const filepath = path.join(loc.normalized, 'workgroupMappings.json');
    fs.writeFileSync(filepath, data);
}


function generateSchoolInfo(loc) {
    const filepath = path.join(loc.normalized, 'schools.json');
    const id = 'sch.' + loc.country + '.' + loc.language + '.' + uuid.v4();
    const school = {
        id: id,
        entity: 'sch',
        lang: loc.language,
        country: loc.country,
    }
    try {
        const info = require('./ck-school-info.json');
        for (let prop in info) {
            school[prop] = info[prop];
        }
    }
    catch (e) {
        console.log('Warning: ' + e.message);
    }
    school.majors = [];
    global.workgroups.map(function(w) {
        if (!w.instructionalPrograms) {
            return;
        }
        w.instructionalPrograms.map(function (ip) {
            ip.Schools = [ id ];
            school.majors.push({ cipCode: ip.cipCode });
        })
    })
    const data = JSON.stringify(school, null, 4);
    fs.writeFileSync(filepath, data);
}


function instructionalProgramsByClassification() {
    let groups = {};
    global.docs.forEach(function(ip) {
        const classification = ip[ckClassification];
        if (!groups[classification]) {
            groups[classification] = [];
        }
        groups[classification].push(ip);
    });
    return groups;
}


function writeWorkgroups(workgroups, loc) {
    const id = 'ckwg.' + loc.country + '.' + loc.language;
    const localizedWorkgroups = {
        id: id,
        entity: 'ckwg',
    }

    //TODO: use Google Translate for personality types and titles?
    // https://github.com/Localize/node-google-translate

    localizedWorkgroups.workgroups = global.workgroups.map(function(w) {
        return {
            id: w.id,
            personalityType: w.personalityType,
            title: w.title,
            pt: w.personalityType[0],
        }
    });
    const filepath = path.join(loc.normalized, 'workgroups.json');
    const data = JSON.stringify(localizedWorkgroups, null, 4);
    fs.writeFileSync(filepath, data);
}

