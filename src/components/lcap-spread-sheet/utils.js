import GC from '@spread';
import _, { uniqBy } from 'lodash';

import consts from './consts';
import { inDynamicTableArea, tableWithData } from './dynamicTable.util';
import CustomCell from './CustomCell';

export const fieldSupportWidgetMap = {
    Whole: ['Checkbox', 'Cellphone', 'Number', 'SerialNumber'],
    Decimal: ['Checkbox', 'Cellphone', 'Number', 'SerialNumber'],
    String: ['Checkbox', 'Select', 'MultipleSelect', 'Cellphone', 'Email', 'Text', 'Date', 'Number', 'SerialNumber'],
    Date: ['Date', 'Text'],
    DateTime: ['Date', 'Text'],
};

/**
 * 获取动态表中合并之后的单元格
 * @param {*} params
 */
export function traverseTableActualCell(sheet, table, cb) {
    const range = table.range();
    const rowStart = range.row;
    const colStart = range.col;
    let actualColIndex = 0;
    const result = [];
    for (let i = 0; i < range.rowCount; i++) {
        for (let j = 0; j < range.colCount; j++) {
            const row = rowStart + i;
            const col = colStart + j;
            if (cb) {
                cb(row, col, actualColIndex);
            }
            result.push({
                row, col, actualColIndex,
            });
            actualColIndex += 1;
            const span = sheet.getSpan(row, col);
            // 合并的单元格跳过，只取其第一个单元格
            if (span) {
                j = j + span.colCount - 1;
            }
        }
    }
    return result;
}

/**
 * 查找某范围的各方向的坐标
 * @param {GCTYPE.Spread.Sheets.Worksheet} sheet 表单
 * @param {GCTYPE.Spread.Sheets.Range} range 范围
 * @param {'row' | 'col'} direction 行或列
 * @param {-1 | 1} step 负方向或正方向
 * @returns {number}
 */
export function getIndexByRangeStep(sheet, range, direction, step) {
    range = getActualRange(sheet, range);
    if (direction === 'row') {
        if (step === 1) {
            return range.row + range.rowCount;
        }
        return range.row;
    }

    if (step === 1) {
        return range.col + range.colCount;
    }
    return range.col;
}

/**
 * 将数字列转换为字符串，如 1 -> B
 *
 * @param {number} num 列号，0开始
 */
export function num2Letter(num) {
    let letters = '';
    const AZLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    while (num >= 0) {
        letters = AZLetters[num % 26] + letters;
        num = Math.floor(num / 26) - 1;
    }
    return letters;
}

/**
 * 获取范围对应的行列描述，如第 3 - 8 行
 *
 * @param {Array.<GCTYPE.Spread.Sheets.Range>} ranges 范围列表
 * @param {'row'|'col'} direction 行或列
 */
export function getRangeRowOrColDesc(ranges, direction) {
    if (!Array.isArray(ranges)) {
        ranges = [ranges];
    }
    let rangeText = '';
    if (direction === 'row') {
        if (ranges.length === 1) {
            if (ranges[0].rowCount === 1) {
                rangeText = '行';
            } else {
                rangeText = '第 ' + (ranges[0].row + 1) + ' - ' + (ranges[0].row + ranges[0].rowCount) + ' 行';
            }
        } else {
            rangeText = '所选行';
        }
    } else if (ranges.length === 1) {
        if (ranges[0].colCount === 1) {
            rangeText = '列';
        } else {
            rangeText = '第 ' + num2Letter(ranges[0].col) + ' - ' + num2Letter(ranges[0].col + ranges[0].colCount - 1) + ' 列';
        }
    } else {
        rangeText = '所选列';
    }
    return rangeText;
}

/**
 * 检测单元格是否为控件
 * @param {GCTYPE.Spread.Sheets.Worksheet} sheet 表单
 * @param {number} row
 * @param {number} col
 */
export function isWidgetCell(sheet, row, col) {
    const cellType = sheet.getCellType(row, col);
    if (cellType) {
        return !!cellType.widgetType || (cellType instanceof GC.Spread.Sheets.CellTypes.CheckBox);
    }
    return false;
}

/**
 * 根据行列获取单元格的tag内容
 * @param {GCTYPE.Spread.Sheets.Worksheet} sheet 表单
 * @param {number} row
 * @param {number} col
 * @param {string} path 路径字符串
 */
export function getTagContentByRange(sheet, row, col, path) {
    const tagInfo = sheet.getTag(row, col);
    if (!tagInfo)
        return;
    return _.get(tagInfo, path);
}

export function isSelectWidget(type) {
    return ['Select', 'MultipleSelect'].includes(type);
}

export function traverseSheetCell(sheet, cb, breakFn, options = {}) {
    if (!cb) {
        return;
    }
    const { dataTable } = options.sheetType === 'json' ? sheet.data : sheet._modelManager.sheetModels[3];
    if (Object.prototype.toString.call(dataTable) === '[object Object]' && Object.keys(dataTable).length) {
        const rows = Object.keys(dataTable);
        for (let row = 0; row < rows.length; row++) {
            const rowNumber = rows[row];
            if (typeof dataTable[rowNumber] === 'object') {
                const rowObj = dataTable[rowNumber];
                if (!rowObj) {
                    continue;
                }
                const cols = Object.keys(rowObj);
                for (let col = 0; col < cols.length; col++) {
                    const colNumber = cols[col];
                    const cellInfo = {
                        ...dataTable[rowNumber][colNumber],
                        row: +rowNumber,
                        col: +colNumber,
                    };
                    if (breakFn && breakFn(row, col, cellInfo)) {
                        return false;
                    }
                    if (cb(sheet, cellInfo) === false) {
                        return;
                    }
                }
            }
        }
    }
}

export function traverseWorkbookCell(workbook, cb) {
    const { sheets } = workbook;
    sheets.forEach((sheet) => traverseSheetCell(sheet, cb));
}

/**
 * 获取范围(将-1替换成真实行列数)，4个值都有可能为-1
 * @param {GCTYPE.Spread.Sheets.Worksheet} sheet
 * @param {GCTYPE.Spread.Sheets.Range} range
 * @returns {GCTYPE.Spread.Sheets.Range}
 */
export function getActualRange(sheet, range) {
    const rowCount = sheet.getRowCount();
    const columnCount = sheet.getColumnCount();
    if (range.row === -1 && range.col === -1) {
        return new GC.Spread.Sheets.Range(0, 0, rowCount, columnCount);
    }
    if (range.row === -1) {
        return new GC.Spread.Sheets.Range(0, range.col, rowCount, range.colCount);
    }
    if (range.col === -1) {
        return new GC.Spread.Sheets.Range(range.row, 0, range.rowCount, columnCount);
    }
    return new GC.Spread.Sheets.Range(range.row, range.col, range.rowCount, range.colCount);
}

/**
 * 是否为单一合并态单元格
 * @param {GCTYPE.Spread.Sheets.Worksheet} sheet 表单
 * @param {Array.<GCTYPE.Spread.Sheets.Range>} ranges 范围列表
 * @returns {boolean}
 */
export function isSingleMergedCell(sheet, ranges) {
    if (ranges.length === 1) {
        const spans = sheet.getSpans(ranges[0]);
        if (spans.length === 1) {
            return spans[0].equals(getActualRange(sheet, ranges[0]));
        }
    }
    return false;
}

/**
 * 是否为单一单元格
 * @param {GCTYPE.Spread.Sheets.Worksheet} sheet 表单
 * @param {Array.<GCTYPE.Spread.Sheets.Range>} ranges 范围列表
 * @returns {boolean}
 */
export function isSingleCell(sheet, ranges) {
    if (ranges.length === 1) {
        return (ranges[0].rowCount === 1 && ranges[0].colCount === 1) || isSingleMergedCell(sheet, ranges);
    }
    return false;
}

/**
 * 是否为全行或全列
 *
 * @param {GCTYPE.Spread.Sheets.Worksheet} sheet 表单
 * @param {Array.<GCTYPE.Spread.Sheets.Range>} ranges 范围列表
 * @param {'row'|'col'} direction 行或列
 */
export function isFullRowOrCol(sheet, ranges, direction) {
    if (!Array.isArray(ranges)) {
        ranges = [ranges];
    }
    if (direction === 'row') {
        const colCount = sheet.getColumnCount();
        return ranges.every((range) => {
            if (range.col === -1) {
                return true;
            }
            return range.colCount === colCount && isSingleCell(sheet, [range]);
        });
    }
    const rowCount = sheet.getRowCount();
    return ranges.every((range) => {
        if (range.row === -1) {
            return true;
        }
        return range.rowCount === rowCount && isSingleCell(sheet, [range]);
    });
}

/**
 * 遍历单元格
 * @param {GCTYPE.Spread.Sheets.Range} range
 * @param {Function} cb
 * @param {Function} breakFn 中断函数
 * @returns {boolean} 是否成功遍历
 */
export function traverseCellRange(range, cb, breakFn) {
    const rowStart = range.row;
    const colStart = range.col;
    for (let i = 0; i < range.rowCount; i++) {
        for (let j = 0; j < range.colCount; j++) {
            if (!breakFn || !breakFn(rowStart + i, colStart + j)) {
                cb && cb(rowStart + i, colStart + j, i, j);
            } else {
                return false;
            }
        }
    }
    return true;
}

// 判断是否是合并单元格,如果是判断是否是合并单元格的起始格子,因为value默认在第一个单元格
export function isFirstCellInSpan(sheet, row, col) {
    const span = sheet.getSpan(row, col);
    if (!span || (row === span.row && col === span.col)) {
        return true;
    }
    return false;
}

export function processSelectOptionsWithDatasourceOptions(selectOptions, datasourceItems) {
    let dataSourceIndex = -1;
    let dataSourceLength = 0;
    selectOptions.forEach((item, index) => {
        if (item.type === 'dataSource') {
            dataSourceIndex = dataSourceIndex === -1 ? index : dataSourceIndex;
            dataSourceLength++;
        }
    });
    selectOptions.splice(dataSourceIndex, dataSourceLength, ...datasourceItems);
    // 对 选项进行去重操作
    selectOptions = uniqBy(selectOptions, 'text');
    return selectOptions;
}

/** @returns {GCTYPE.Spread.Sheets.Worksheet} */
export function getSheetBySheetId(workbook, id) {
    return workbook.sheets.find((sheet) => sheet._id === id);
}

/** @type {GCTYPE.Spread.Sheets.DataValidation.DefaultDataValidator} */
export function validatorCommonSetting(validator, options = { ignoreBlank: false }) {
    const { DataValidation } = GC.Spread.Sheets;
    validator.highlightStyle({
        type: DataValidation.HighlightType.dogEar,
        color: 'red',
        position: DataValidation.HighlightPosition.topRight,
    });
    if (options.isCustom) {
        validator.type(GC.Spread.Sheets.DataValidation.CriteriaType.custom);
    }
    validator.ignoreBlank(!!options.ignoreBlank);
}

// 设置控件校验器
export function setWidgetValidator(target, workbook, ranges) {
    if (!workbook)
        return;
    const sheet = workbook.getActiveSheet();
    const condition = new GC.Spread.Sheets.ConditionalFormatting.Condition();
    const widgetDataValidator = new GC.Spread.Sheets.DataValidation.DefaultDataValidator(condition);
    widgetDataValidator.type(consts.customDataValidatorTypesMap.widget);
    validatorCommonSetting(widgetDataValidator, {
        ignoreBlank: true,
    });
    widgetDataValidator.initWidgetValidator(target.type, target.settings);
    ranges && ranges.forEach((range) => {
        if (sheet) {
            range = getActualRange(sheet, range);
            traverseCellRange(range, (row, col) => {
                sheet.setDataValidator(row, col, widgetDataValidator);
            });
        }
    });
}

export function validateTargets(targets) {
    targets = targets || this.props.form.targets;
    const targetsError = targets.some((target) => target.error);
    let hasError = false;
    const newTargets = targets.map((target) => {
        const validator = getValidator(target.type);
        if (validator) {
            target.error = validator(target.settings, targets);
            hasError = target.error || hasError;
        }
        return target;
    });
    if (hasError || (!hasError && targetsError)) {
        // this.props.dispatch({ type: 'form/resetTargets', payload: newTargets });
    }
    return hasError;
}

const WidgetsWithValidators = consts.widgetList.filter((w) => w.validate);

export function getValidator(widgetType) {
    const widget = WidgetsWithValidators.find((w) => w.type === widgetType);
    return widget && widget.validate;
}

// 根据控件配置转换类型
export function transformWidgetSettingToCell(widget, option = {}) {
    const cellProps = {};
    const setting = widget.settings;
    let cellType;

    switch (widget.type) {
        case 'Select':
        case 'MultipleSelect':
            if (option.dataSourceOptions) {
                const datasourceItems = option.dataSourceOptions?.map((item) => ({
                    text: item,
                }));
                let manualItems = _.cloneDeep(setting?.manualItems?.value) || [];
                manualItems = processSelectOptionsWithDatasourceOptions(manualItems, datasourceItems);
                setting.items = manualItems;
            }
            cellProps.cellButtons = [
                {
                    imageType: GC.Spread.Sheets.ButtonImageType.dropdown,
                    command: 'openList',
                },
            ];
            cellProps.watermark = '请选择';
            break;
        case 'Date':
            cellProps.cellButtons = [
                {
                    imageType: GC.Spread.Sheets.ButtonImageType.calendar,
                    command: 'openList',
                },
            ];
            cellProps.watermark = '请选择日期';
            cellProps.showEllipsis = true;
            break;
        case 'Number':
            cellProps.watermark = '请输入数字';
            break;
        case 'Text':
            cellProps.watermark = '请输入文本';
            break;
        case 'Email':
            cellProps.watermark = '请输入邮箱';
            break;
        case 'Cellphone':
            cellProps.watermark = '请输入手机号';
            break;
        default:
            break;
    }
    if (['Date', 'Select', 'MultipleSelect', 'SerialNumber'].includes(widget.type)) {
        cellType = new CustomCell(widget.type, setting);
        cellProps.cellType = cellType;
        if (widget.type === 'SerialNumber') {
            cellProps.hAlign = GC.Spread.Sheets.HorizontalAlign.center;
        }
    } else if (['Number', 'Text', 'Email', 'Cellphone'].includes(widget.type)) {
        cellType = new GC.Spread.Sheets.CellTypes.Text();
        cellType.widgetType = widget.type;
        cellType.widgetSetting = setting;
        cellProps.cellType = cellType;
    } else if (widget.type === 'Checkbox') {
        const description = setting.description && setting.description.value || '';
        cellType = new GC.Spread.Sheets.CellTypes.CheckBox();
        cellType.widgetType = widget.type;
        if (description) {
            cellType.caption(description);
        }
        cellType.boxSize(14);
        cellProps.cellType = cellType;
    }
    return cellProps;
}

export function getTagKeys(tag = {}) {
    const tagFilterKeys = ['toString', 'valueOf'];
    return Object.keys(tag).filter((key) => !tagFilterKeys.includes(key));
}

function getFieldTypesFromTag(tag, filterFieldIds = []) {
    const arr = [];
    if (tag && tag.tablesMap) {
        const tables = getTagKeys(tag.tablesMap);
        if (tables.length) {
            tables.forEach((tableName) => {
                const fieldMap = tag.tablesMap[tableName].fieldMap;
                const fieldNames = getTagKeys(fieldMap);
                fieldNames.forEach((filedName) => {
                    const fieldInfo = fieldMap[filedName];
                    if (fieldInfo && !filterFieldIds.includes(fieldInfo.id)) {
                        arr.push(fieldInfo.type);
                    }
                });
            });
        }
    }
    if (arr.length) {
        return arr;
    }
    return [];
}

export function getFieldTypeInRanges(sheet, ranges, filterFieldIds = []) {
    let types = [];
    ranges && ranges.forEach((range) => {
        if (sheet) {
            traverseCellRange(range, (row, col) => {
                if (isFirstCellInSpan(sheet, row, col)) {
                    const tag = sheet.getTag(row, col);
                    if (tag && tag.tablesMap) {
                        const fieldTypes = getFieldTypesFromTag(tag, filterFieldIds);
                        if (fieldTypes.length) {
                            types.push(...fieldTypes);
                        }
                    }
                }
            });
        }
    });
    types = Array.from(new Set(types));
    return types;
}

export function getWidgetList(sheet, sels) {
    const showWidgetList = isSingleCell(sheet, sels) || (!isFullRowOrCol(sheet, sels, 'row') && !isFullRowOrCol(sheet, sels, 'col'));
    const prevFieldTypes = getFieldTypeInRanges(sheet, sels);
    let widgetList = consts.widgetList;
    for (let i = 0; i < prevFieldTypes.length; i++) {
        widgetList = widgetList.filter((item) => fieldSupportWidgetMap[prevFieldTypes[i]].includes(item.type));
    }

    if (!inDynamicTableArea(sheet, sels) || tableWithData(sheet, sels)) {
        widgetList = widgetList.filter((w) => w.type !== 'SerialNumber');
    }
    return {
        showWidgetList,
        widgetList,
    };
}
