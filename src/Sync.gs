/**
 * Sync.gs
 * Orchestrates: ClickUp.gs (fetch) -> mapping -> Sheet.gs (write).
 */

/**
 * Main sync entry point. Bound to the "Sync My Tasks" menu item.
 */
function Sync_run() {
  try {
    const entries = ClickUp_fetchMyTimeEntries();

    if (entries.length === 0) {
      SpreadsheetApp.getUi().alert('No time entries found for today. Log some time in ClickUp first.');
      return;
    }

    entries.forEach(function(entry) {
      Sheet_upsertTimeEntryRow_(Sync_mapTimeEntryToRowData_(entry));
    });

    SpreadsheetApp.getUi().alert('Sync complete: ' + entries.length + ' time entries processed.');
  } catch (err) {
    SpreadsheetApp.getUi().alert('Sync failed: ' + err.message);
  }
}

/**
 * Converts one ClickUp time entry object into a plain object keyed by sheet column name.
 * User, Department, Billable, and Tags are fixed dropdown defaults from Config —
 * NOT extracted from ClickUp.
 */
function Sync_mapTimeEntryToRowData_(entry) {
  const now = new Date();
  const timezone = Config_get('TIMEZONE');

  return {
    'User': Config_get('USER_NAME'),
    'Department': Config_get('DEPARTMENT_DEFAULT'),
    'Description': (entry.task && entry.task.name) || '',
    'Tags': Config_get('TAGS_DEFAULT'),
    'Billable': Config_get('BILLABLE_DEFAULT'),
    'Date': Helpers_msToDateString(entry.start),
    'Start Time': Helpers_msToTimeString(entry.start),
    'End Time': Helpers_msToTimeString(entry.end),
    'Duration': Helpers_msToDurationString(entry.duration),
    'ClickUp Task ID': (entry.task && entry.task.id) || '',
    'Time Entry ID': entry.id,
    'Task URL': (entry.task && entry.task.url) || '',
    'Status': (entry.task && entry.task.status && entry.task.status.status) || '',
    'Last Sync': Utilities.formatDate(now, timezone, 'yyyy-MM-dd HH:mm:ss'),
    'Updated At': Utilities.formatDate(now, timezone, 'yyyy-MM-dd HH:mm:ss')
  };
}
