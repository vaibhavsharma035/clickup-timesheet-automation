/**
 * Helpers.gs
 * Pure utility functions — no external calls, no side effects (except Config_get reads).
 */

/**
 * Converts an epoch-millisecond string/number to a "HH:mm" time string,
 * in the timezone configured in Settings.
 */
function Helpers_msToTimeString(epochMs) {
  const timezone = Config_get('TIMEZONE');
  return Utilities.formatDate(new Date(Number(epochMs)), timezone, 'HH:mm');
}

/**
 * Converts an epoch-millisecond string/number to a "MM/dd/yyyy" date string,
 * in the timezone configured in Settings.
 */
function Helpers_msToDateString(epochMs) {
  const timezone = Config_get('TIMEZONE');
  return Utilities.formatDate(new Date(Number(epochMs)), timezone, 'MM/dd/yyyy');
}

/**
 * Converts a duration in milliseconds to "H:MM" format (e.g. 5400000ms -> "1:30").
 */
function Helpers_msToDurationString(durationMs) {
  const totalMinutes = Math.round(Number(durationMs) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours + ':' + (minutes < 10 ? '0' : '') + minutes;
}

/**
 * Returns today's start/end as Unix millisecond timestamps,
 * anchored to the timezone configured in Settings.
 */
function Helpers_getTodayRangeMs() {
  const timezone = Config_get('TIMEZONE');
  const todayStr = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
  const startOfDay = new Date(todayStr + 'T00:00:00');
  const endOfDay = new Date(todayStr + 'T23:59:59');
  return { start: startOfDay.getTime(), end: endOfDay.getTime() };
}
