import { traverseCellRange } from './utils';

export function getTable(sheet, sels) {
    const { row, col } = sels[0];
    return sheet.tables.find(row, col);
}

// 遍历动态表第一行
export function traverseDynamicTableHeader(sheet, table, cb, breakFn) {
    traverseCellRange({ row: table._row, col: table._col, rowCount: 1, colCount: table._colCount }, (row, col, rowIndex, colIndex) => {
        cb(row, col, rowIndex, colIndex);
    });
}

export function inDynamicTableArea(sheet, sels) {
    if (!sheet.tables.all().length || sels.length !== 1) {
        return false;
    }
    const table = getTable(sheet, sels);
    return table;
}

// table上的单元格已经拖入数据，则不允许添加序号
export function tableWithData(sheet, sels) {
    let result = false;
    traverseCellRange(sels[0], (row, col) => {
        const table = sheet.tables.find(row, col);
        if (table && table.tableSetting && table.tableSetting.dataModel) {
            const column = table.tableSetting.dataModel.data.column || [];
            column.some((pill) => {
                if (pill.col === col && pill.row === row && pill.fieldId) {
                    result = true;
                    return true;
                }
            });
        }
    });

    return result;
}
