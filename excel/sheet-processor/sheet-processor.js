class SheetProcessor {
    constructor(sheet) {
        this.sheet = sheet;
        this.rowStride = {}
        this.colStride = {}
        const merges = sheet['!merges'];
        if (merges) {
            function updateStride(merge, which, stride, start, end) {
                let next = stride[start];
                if (next && next != end) {
                    throw new Error('Conflicting ' + which + ' strides: ' + next + ', ' + end);
                }
                if (end != start + 1) {
                    stride[start] = end;
                }
            }
            let self = this;
            merges.forEach(function(m) {
                updateStride(m, 'row', self.rowStride, m.s.r + 1, m.e.r + 2);
                updateStride(m, 'column', self.colStride, m.s.c + 1, m.e.c + 2);
            });
        }
        this.range = sheet['!ref'].split(':');
    }

    get firstColumn() {
        return this.range[0].split(/[0-9]+/)[0];
    }

    get firstRow() {
        return this.range[0].split(/[A-Z]+/)[1];
    }

    get lastColumn() {
        return this.range[1].split(/[0-9]+/)[0];
    }

    get lastRow() {
        return this.range[1].split(/[A-Z]+/)[1];
    }

    getNextRow(i) {
        let result = this.rowStride[i];
        if (!result) result = +i + 1;
        return result;
    }

    getNextColumn(i) {
        let result = this.colStride[i];
        if (!result) result = String.fromCharCode(i.charCodeAt(0) + 1);
        return result;
    }

    forEachCell(callback) {
        for (let row = this.firstRow, nextRow = row; row != this.lastRow; row = nextRow) {
            nextRow = this.getNextRow(row);
            for (let col = this.firstColumn, nextCol = col; col < this.lastColumn; col = nextCol) {
                nextCol = this.getNextColumn(col);
                callback(col, row, nextRow, nextCol == this.lastColumn);
            }
        }
    }
}

module.exports = SheetProcessor;

