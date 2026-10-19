import xlsx from 'xlsx';
import { mapExcelData } from '../utils/excelMapper.js';
import { detectFileKind, getMaxRows } from '../utils/uploadValidation.js';

export class ExcelRowLimitError extends Error {
  constructor(maxRows) {
    super(`Sheet has more than ${maxRows} rows; split the file`);
    this.name = 'ExcelRowLimitError';
    this.statusCode = 400;
  }
}

export function parseExcel(buffer, options = {}) {
  const maxRows = options.maxRows || getMaxRows();
  try {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      return [];
    }

    // 1. Inspect sheet names first without reading sheet contents into memory
    const sheetInfo = xlsx.read(buffer, { type: 'buffer', bookSheets: true });
    if (!sheetInfo.SheetNames || sheetInfo.SheetNames.length === 0) {
      console.warn('[PARSER] Excel file has no sheets');
      return [];
    }

    const firstSheetName = sheetInfo.SheetNames[0];

    // 2. Read ONLY the first sheet, with sheetRows: maxRows + 1
    const workbook = xlsx.read(buffer, {
      type: 'buffer',
      sheets: [firstSheetName],
      sheetRows: maxRows + 1
    });

    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) {
      console.warn('[PARSER] First sheet is empty or invalid');
      return [];
    }

    // 3. Detect if sheet has more than maxRows data rows
    // In XLSX and XLS, SheetJS sets !fullref if sheetRows truncated the sheet
    if (sheet['!fullref']) {
      const fullRange = xlsx.utils.decode_range(sheet['!fullref']);
      const totalRows = fullRange.e.r - fullRange.s.r + 1;
      if (totalRows > maxRows + 1) {
        throw new ExcelRowLimitError(maxRows);
      }
    }

    // Also check CSV files where !fullref is not set
    if (detectFileKind(buffer) === 'csv') {
      const text = buffer.toString('utf-8');
      const lines = text.split(/\r\n|\r|\n/).filter(line => line.trim().length > 0);
      if (lines.length > maxRows + 1) {
        throw new ExcelRowLimitError(maxRows);
      }
    }

    const data = xlsx.utils.sheet_to_json(sheet);
    if (data.length > maxRows) {
      throw new ExcelRowLimitError(maxRows);
    }

    return mapExcelData(data);
  } catch (error) {
    if (error instanceof ExcelRowLimitError || error.name === 'ExcelRowLimitError') {
      throw error;
    }
    console.error('[PARSER] Failed to parse Excel file:', error.message);
    return [];
  }
}
