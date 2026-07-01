import xlsx from 'xlsx';
import { mapExcelData } from '../utils/excelMapper.js';

export function parseExcel(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  return mapExcelData(data);
}
