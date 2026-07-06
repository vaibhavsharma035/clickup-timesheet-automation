/**
 * ClickUp.gs
 * All direct communication with the ClickUp REST API lives here.
 */

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

function ClickUp_getAuthHeaders_() {
  return {
    'Authorization': Config_get('CLICKUP_TOKEN'),
    'Content-Type': 'application/json'
  };
}

function ClickUp_get_(endpoint, queryParams) {
  const url = CLICKUP_API_BASE + endpoint + ClickUp_buildQueryString_(queryParams);
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: ClickUp_getAuthHeaders_(),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (statusCode === 401) {
    throw new Error('ClickUp rejected the API token. Run "Set ClickUp Token" again.');
  }
  if (statusCode !== 200) {
    throw new Error('ClickUp API error (' + statusCode + '): ' + (body.err || 'Unknown error'));
  }
  return body;
}

function ClickUp_buildQueryString_(params) {
  if (!params) return '';
  const parts = [];
  for (const key in params) {
    const value = params[key];
    if (Array.isArray(value)) {
      value.forEach(function(v) {
        parts.push(encodeURIComponent(key + '[]') + '=' + encodeURIComponent(v));
      });
    } else {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function ClickUp_getTeamsAndUser_() {
  return ClickUp_get_('/team');
}

/**
 * Fetches the currently authenticated user's own identity directly.
 * More reliable than parsing team members (which can come back empty
 * depending on workspace permission settings).
 */
function ClickUp_getCurrentUser_() {
  return ClickUp_get_('/user');
}

/**
 * Fetches all time entries logged by the configured USER_ID within a date range.
 * Defaults to "today" (in the configured timezone) if no range is given.
 */
function ClickUp_fetchMyTimeEntries(startDate, endDate) {
  const workspaceId = Config_get('WORKSPACE_ID');
  const userId = Config_get('USER_ID');

  if (!startDate || !endDate) {
    const range = Helpers_getTodayRangeMs();
    startDate = range.start;
    endDate = range.end;
  }

  const response = ClickUp_get_('/team/' + workspaceId + '/time_entries', {
    'assignee': userId,
    'start_date': startDate,
    'end_date': endDate,
    'include_task_tags': true,
    'include_location_names': true
  });

  return response.data || [];
}
