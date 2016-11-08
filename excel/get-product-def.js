// Extract product definitions from Excel file
'use strict';
const fs = require('fs'); // for validating input file path
const path = require('path');

const xlsx = require('xlsx');
const SheetProcessor = require('./sheet-processor');

const CmdLineSpec = require('../command-line');
const cmdLineSpec = new CmdLineSpec([
    { name: 'file', alias: 'f', type: String },
    { name: 'sheet', alias: 's', type: String, defaultValue: 'Sheet1' },
    { name: 'workgroups', alias: 'w', type: Boolean, defaultValue: false },
]);

const args = validateArgs(cmdLineSpec.parse(process.argv));
const workbook = xlsx.readFile(args.file);
const sheet = workbook.Sheets[args.sheet];
if (!sheet) {
    throw new Error('sheet not found: ' + args.sheet);
}
const sheetProcessor = new SheetProcessor(sheet);

const global = {
    docs: []
};


sheetProcessor.forEachCell(function(col, row, nextRow, rowComplete) {
    let cell = sheetProcessor.sheet[col + row];
    if (row == sheetProcessor.firstRow) {
        // assume first row has the titles
        if (!global.prop) global.prop = [];
        if (cell) {
            global.prop[col] = cell.v;
        }
        return;
    }
    cell = findCellValue(sheetProcessor.sheet, col, row, nextRow);
    if (!global.doc) {
        global.doc = {};
    }
    global.doc[global.prop[col]] = cell? cell.v : cell; 
    if (rowComplete) {
        let temp = JSON.parse(JSON.stringify(global.doc));
        if (Object.keys(temp) != 0) {
            global.docs.push(temp);
        }
    }
});


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


console.log(JSON.stringify(global.docs, null, 4));

