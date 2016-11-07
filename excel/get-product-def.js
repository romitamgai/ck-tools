// Extract product definitions from Excel file
const xlsx = require('xlsx');
const SheetProcessor = require('./sheet-processor');

const workbook = xlsx.readFile(process.argv[2]);
sheetProcessor = new SheetProcessor(workbook.Sheets.Sheet1);

programs = [];

sheetProcessor.forEachCell(function(col, row, nextRow, rowComplete) {
    cell = sheetProcessor.sheet[col + row];
    if (row == sheetProcessor.firstRow) {
        // assume first row has the titles
        if (!this.prop) prop = []
        prop[col] = cell.v;
        return;
    }
    cell = findCellValue(sheetProcessor.sheet, col, row, nextRow);
    if (!this.instructionalProgram) {
        instructionalProgram = {}
    }
    instructionalProgram[prop[col]] = cell? cell.v : cell; 
    if (rowComplete) {
        // console.log(JSON.stringify(instructionalProgram, null, 4));
        programs.push(JSON.parse(JSON.stringify(instructionalProgram)));
    }
});


function findCellValue(sheet, col, row, nextRow) {
    cell = sheet[col + row];
    while (!cell && row < nextRow) {
        ++row;
        cell = sheet[col + row];
    }
    if (prop[col] == 'CK Classification') {
        if (!cell) cell = prev;
        prev = cell;
    }
    return cell;
}
        
console.log(JSON.stringify(programs, null, 4));

