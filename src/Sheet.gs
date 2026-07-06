/**
 * Sheet.gs
 * Owns all reads/writes to the Timesheet sheet.
 * Column order here MUST match the physical sheet header row exactly.
 */

const SHEET_COLUMNS = [
  'User', 'Project', 'Department', 'Description', 'Tags', 'Billable',
  'Date', 'Start Time', 'End Time', 'Duration',
  'ClickUp Task ID', 'Time Entry ID', 'Task URL', 'Status', 'Last Sync', 'Updated At'
];

// Columns Sync.gs is allowed to overwrite on an existing row.
// 'Project' is deliberately excluded — it's manual and must never be touched after insert.
const SHEET_AUTO_COLUMNS = [
  'User', 'Department', 'Description', 'Tags', 'Billable',
  'Date', 'Start Time', 'End Time', 'Duration',
  'ClickUp Task ID', 'Time Entry ID', 'Task URL', 'Status', 'Last Sync', 'Updated At'
];

function Sheet_getDataSheet_() {
  const sheetName = Config_get('SHEET_NAME');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet "' + sheetName + '" not found. Check Settings > SHEET_NAME.');
  }
  return sheet;
}

/**
 * Maps column name -> 1-indexed column number, read live from row 1.
 */
function Sheet_getHeaderMap_() {
  const sheet = Sheet_getDataSheet_();
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headerRow.forEach(function(header, i) {
    if (header) map[header] = i + 1;
  });

  SHEET_COLUMNS.forEach(function(col) {
    if (!map[col]) {
      throw new Error('Expected column "' + col + '" not found in sheet headers.');
    }
  });

  return map;
}

/**
 * Searches column "Time Entry ID" for a match.
 * Returns the 1-indexed row number, or -1 if not found.
 */
function Sheet_findRowByTimeEntryId_(timeEntryId) {
  const sheet = Sheet_getDataSheet_();
  const headerMap = Sheet_getHeaderMap_();
  const col = headerMap['Time Entry ID'];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const ids = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(timeEntryId)) {
      return i + 2;
    }
  }
  return -1;
}

/**
 * Inserts a brand new row. 'Project' is intentionally left blank —
 * it's filled in manually after sync.
 */
function Sheet_insertRow_(rowData) {
  const sheet = Sheet_getDataSheet_();
  const headerMap = Sheet_getHeaderMap_();
  const newRow = new Array(SHEET_COLUMNS.length).fill('');

  SHEET_AUTO_COLUMNS.forEach(function(col) {
    if (rowData[col] !== undefined) {
      newRow[headerMap[col] - 1] = rowData[col];
    }
  });

  sheet.appendRow(newRow);
}

/**
 * Updates ONLY the auto columns of an existing row. 'Project' is never written here.
 */
function Sheet_updateAutoColumns_(rowNumber, rowData) {
  const sheet = Sheet_getDataSheet_();
  const headerMap = Sheet_getHeaderMap_();

  SHEET_AUTO_COLUMNS.forEach(function(col) {
    if (rowData[col] !== undefined) {
      sheet.getRange(rowNumber, headerMap[col]).setValue(rowData[col]);
    }
  });
}

/**
 * Single entry point Sync.gs calls per time entry: insert if new, update-in-place if seen before.
 */
function Sheet_upsertTimeEntryRow_(rowData) {
  const existingRow = Sheet_findRowByTimeEntryId_(rowData['Time Entry ID']);
  if (existingRow === -1) {
    Sheet_insertRow_(rowData);
  } else {
    Sheet_updateAutoColumns_(existingRow, rowData);
  }
}
