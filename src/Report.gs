/**
 * Report.gs
 * Generates the daily report: "Client Feedbacks" section (from sheet data)
 * + synthetic "Learning" section, for either today or a chosen date.
 */

const REPORT_LEARNING_TOPICS = [
  'Playwright with Python',
  'Excel Automation',
  'Redirect Validation',
  'URL Testing',
  'Automation Script Development',
  'API Testing',
  'Python Automation',
  'n8n Automation'
];

/**
 * Menu item: "Generate Daily Report" — always uses today's date.
 */
function Report_generateDaily() {
  const timezone = Config_get('TIMEZONE');
  const todayStr = Utilities.formatDate(new Date(), timezone, 'MM/dd/yyyy');
  Report_generateForDate_(todayStr);
}

/**
 * Menu item: "Generate Report for Selected Date" — reads whatever date is
 * currently selected in the Settings sheet's REPORT_DATE cell (native
 * Google Sheets calendar picker via Data Validation).
 */
function Report_generateForSelectedDate() {
  try {
    const rawDateValue = Config_get('REPORT_DATE');
    const timezone = Config_get('TIMEZONE');
    const targetDateStr = Report_normalizeDateForCompare_(rawDateValue, timezone);

    if (!Report_isValidDateFormat_(targetDateStr)) {
      SpreadsheetApp.getUi().alert('Please click the REPORT_DATE cell in the Settings sheet and pick a date first.');
      return;
    }

    Report_generateForDate_(targetDateStr);
  } catch (err) {
    SpreadsheetApp.getUi().alert('Please select a date in the Settings sheet (REPORT_DATE cell) first.');
  }
}

function Report_isValidDateFormat_(dateStr) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
}

/**
 * Shared logic: builds and displays a report for any given date string (MM/dd/yyyy).
 */
function Report_generateForDate_(targetDateStr) {
  try {
    const rows = Report_getRowsForDate_(targetDateStr);

    if (rows.length === 0) {
      SpreadsheetApp.getUi().alert('No entries found for ' + targetDateStr + '.');
      return;
    }

    const missingProject = rows.filter(function(row) { return !row['Project']; });
    if (missingProject.length > 0) {
      SpreadsheetApp.getUi().alert(
        missingProject.length + ' row(s) for ' + targetDateStr + ' are missing a Project (client name). Fill those in first.'
      );
    }

    Report_showInDialog_(Report_formatReportText_(rows, targetDateStr));
  } catch (err) {
    SpreadsheetApp.getUi().alert('Report generation failed: ' + err.message);
  }
}

/**
 * Reads all rows from the sheet matching a specific date string (MM/dd/yyyy).
 */
function Report_getRowsForDate_(targetDateStr) {
  const sheet = Sheet_getDataSheet_();
  const headerMap = Sheet_getHeaderMap_();
  const timezone = Config_get('TIMEZONE');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const rows = [];

  dataRange.forEach(function(rawRow) {
    const dateCell = rawRow[headerMap['Date'] - 1];
    const dateStr = Report_normalizeDateForCompare_(dateCell, timezone);
    if (dateStr === targetDateStr) {
      const rowObj = {};
      SHEET_COLUMNS.forEach(function(col) { rowObj[col] = rawRow[headerMap[col] - 1]; });
      rows.push(rowObj);
    }
  });

  return rows;
}

function Report_normalizeDateForCompare_(dateCell, timezone) {
  if (Object.prototype.toString.call(dateCell) === '[object Date]') {
    return Utilities.formatDate(dateCell, timezone, 'MM/dd/yyyy');
  }
  return String(dateCell);
}

/**
 * Builds the full report text for a given set of rows and their date.
 */
function Report_formatReportText_(rows, targetDateStr) {
  const displayDate = Report_formatDateForDisplay_(targetDateStr);

  const clientFeedbackMinutes = Report_sumDurationMinutes_(rows);
  const totalMinutes = Number(Config_get('TOTAL_WORKING_HOURS')) * 60;
  const learningMinutes = Math.max(totalMinutes - clientFeedbackMinutes, 0);

  let output = 'Please find my task update for today, ' + displayDate + '\n\n';
  output += 'Client Feedbacks:\n';

  rows.forEach(function(row, i) {
    const numeral = Report_toLowerRoman_(i + 1);
    const taskName = Report_cleanTaskName_(row['Description']);
    const clientName = row['Project'] || '(client name missing)';
    output += numeral + '. ' + taskName + ' – ' + clientName + '\n';
  });

  output += '\nDuration: ' + Report_minutesToWords_(clientFeedbackMinutes) + '\n\n';
  output += 'Learning:\n' + Report_buildLearningLine_(targetDateStr) + '\n';
  output += 'Duration: ' + Report_minutesToWords_(learningMinutes) + '\n';

  return output.trim();
}

/**
 * Converts "MM/dd/yyyy" into a friendly display format, e.g. "03 July 2026".
 */
function Report_formatDateForDisplay_(dateStr) {
  const parts = dateStr.split('/');
  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);
  const timezone = Config_get('TIMEZONE');
  return Utilities.formatDate(dateObj, timezone, 'dd MMMM yyyy');
}

/**
 * Removes "-QA" (and variants) from a task name. Only affects report output —
 * the sheet's Description column stays untouched.
 */
function Report_cleanTaskName_(taskName) {
  return String(taskName || '').replace(/\s*-\s*QA\b/i, '').trim();
}

/**
 * Sums "H:MM" duration strings from a set of rows into total minutes.
 */
function Report_sumDurationMinutes_(rows) {
  let totalMinutes = 0;
  rows.forEach(function(row) {
    const duration = String(row['Duration'] || '0:00');
    const parts = duration.split(':');
    totalMinutes += (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  });
  return totalMinutes;
}

/**
 * Converts total minutes into "X Hour(s) Y Minutes" wording.
 */
function Report_minutesToWords_(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourText = hours === 1 ? '1 Hour' : hours + ' Hours';
  const minuteText = minutes === 1 ? '1 Minute' : minutes + ' Minutes';
  if (hours > 0 && minutes > 0) return hourText + ' ' + minuteText;
  if (hours > 0) return hourText;
  return minuteText;
}

/**
 * Rotates learning topics based on the day-of-year of the TARGET date
 * (not necessarily today), so re-generating a past date's report is consistent.
 */
function Report_buildLearningLine_(targetDateStr) {
  const parts = targetDateStr.split('/');
  const dateObj = new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));

  const dayOfYear = Report_getDayOfYear_(dateObj);
  const topicCount = REPORT_LEARNING_TOPICS.length;

  const mainIndex = dayOfYear % topicCount;
  const support1 = REPORT_LEARNING_TOPICS[(mainIndex + 1) % topicCount];
  const support2 = REPORT_LEARNING_TOPICS[(mainIndex + 2) % topicCount];
  const mainTopic = REPORT_LEARNING_TOPICS[mainIndex];

  return '* ' + mainTopic + ' – ' + support1 + ', and ' + support2;
}

function Report_getDayOfYear_(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Converts a number to a lowercase Roman numeral (i, ii, iii, iv...).
 */
function Report_toLowerRoman_(num) {
  const romanMap = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'],
    [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
  ];
  let result = '';
  romanMap.forEach(function(pair) {
    while (num >= pair[0]) { result += pair[1]; num -= pair[0]; }
  });
  return result;
}

/**
 * Shows the report in a copyable modal dialog.
 */
function Report_showInDialog_(reportText) {
  const escapedText = reportText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = HtmlService.createHtmlOutput(
    '<textarea style="width:100%;height:350px;font-family:monospace;font-size:13px;">' + escapedText + '</textarea>' +
    '<p style="font-family:sans-serif;font-size:12px;color:#666;">Click inside, Ctrl+A / Cmd+A, then copy.</p>'
  ).setWidth(500).setHeight(450);
  SpreadsheetApp.getUi().showModalDialog(html, 'Daily Report');
}
