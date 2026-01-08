/**
 * CSV 和 Excel 匯出工具函數
 */

import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * CSV 欄位定義
 */
export interface CsvHeader {
  id: string;
  title: string;
}

/**
 * Excel 欄位定義
 */
export interface ExcelHeader {
  key: string;
  header: string;
  width?: number;
}

/**
 * CSV 匯出工具
 * @param data - 要匯出的資料陣列
 * @param headers - CSV 欄位定義
 * @param filename - 檔案名稱（不含副檔名）
 * @returns 生成的檔案路徑
 */
export async function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: CsvHeader[],
  filename: string
): Promise<string> {
  // 建立暫存檔案路徑（使用系統暫存目錄）
  const filePath = path.join(os.tmpdir(), `${filename}.csv`);

  // 建立 CSV writer
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers
  });

  // 寫入資料
  await csvWriter.writeRecords(data);

  return filePath;
}

/**
 * Excel 匯出工具
 * @param data - 要匯出的資料陣列
 * @param headers - Excel 欄位定義
 * @param filename - 檔案名稱（不含副檔名）
 * @param sheetName - 工作表名稱
 * @returns 生成的檔案路徑
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  headers: ExcelHeader[],
  filename: string,
  sheetName = 'Sheet1'
): Promise<string> {
  // 建立工作簿
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 設定欄位
  worksheet.columns = headers.map(h => ({
    header: h.header,
    key: h.key,
    width: h.width || 15
  }));

  // 添加資料
  worksheet.addRows(data);

  // 樣式設定（標題列）
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 建立暫存檔案路徑（使用系統暫存目錄）
  const filePath = path.join(os.tmpdir(), `${filename}.xlsx`);

  // 寫入檔案
  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

/**
 * 清理暫存檔案
 * @param filePath - 要刪除的檔案路徑
 */
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`暫存檔案已刪除: ${filePath}`);
    }
  } catch (error) {
    console.error('清理暫存檔案失敗:', error);
  }
}
