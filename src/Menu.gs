/**
 * Menu.gs
 * The custom "Automation" menu — the entire user-facing interface of this project.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Automation')
    .addItem('Sync My Tasks', 'Sync_run')
    .addItem('Generate Daily Report', 'Report_generateDaily')
    .addItem('Generate Report for Selected Date', 'Report_generateForSelectedDate')
    .addItem('Set ClickUp Token', 'setToken')
    .addToUi();
}

/**
 * Run once during setup, or whenever your ClickUp token changes/expires.
 * Stores the token in Script Properties (never visible in a sheet cell).
 */
function setToken() {
  const token = Browser.inputBox('Enter your ClickUp Token:');
  if (token && token !== 'cancel') {
    PropertiesService.getScriptProperties().setProperty('CLICKUP_TOKEN', token);
    Browser.msgBox('Token saved.');
  }
}
