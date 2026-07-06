/**
 * Config.gs
 * Single source of truth for all configuration.
 * No other file should call PropertiesService or read the Settings sheet directly —
 * always go through Config.get() / Config.set().
 */

const CONFIG_SETTINGS_SHEET_NAME = 'Settings';

// Keys that are sensitive and therefore stored in Script Properties, not the sheet.
const CONFIG_SECRET_KEYS = ['CLICKUP_TOKEN'];

function Config_get(key) {
  if (CONFIG_SECRET_KEYS.indexOf(key) !== -1) {
    const value = PropertiesService.getScriptProperties().getProperty(key);
    if (!value) {
      throw new Error('Missing required setting: ' + key + '. Run "Set ClickUp Token" from the menu.');
    }
    return value;
  }

  const settingsMap = Config_loadSettingsSheetAsMap_();
  const value = settingsMap[key];
  if (value === undefined || value === '') {
    throw new Error('Missing required setting: ' + key + '. Fill it in on the Settings sheet.');
  }
  return value;
}

function Config_set(key, value) {
  if (CONFIG_SECRET_KEYS.indexOf(key) !== -1) {
    PropertiesService.getScriptProperties().setProperty(key, value);
    return;
  }
  Config_writeSettingToSheet_(key, value);
}

function Config_loadSettingsSheetAsMap_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SETTINGS_SHEET_NAME);
  if (!sheet) {
    throw new Error('Settings sheet not found. Expected a tab named "' + CONFIG_SETTINGS_SHEET_NAME + '".');
  }
  const rows = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const key = rows[i][0];
    const value = rows[i][1];
    if (key) map[key] = value;
  }
  return map;
}

function Config_writeSettingToSheet_(key, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SETTINGS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}
