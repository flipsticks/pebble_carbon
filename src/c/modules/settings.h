/**
 * Settings module
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

#pragma once
#include <pebble.h>

// Content shown in the top-left icon-bar slot. Numeric values are persisted, so
// existing entries must keep their values; new entries are appended.
typedef enum {
	TOPLEFT_BATTERY_ICON = 0, // battery level icon (default)
	TOPLEFT_BATTERY_PCT = 1,  // battery percentage number
	TOPLEFT_DATE_WEEKDAY = 2, // day-of-month over 2-letter weekday, e.g. 29/Mo
	TOPLEFT_NONE = 3,         // blank
} TopLeftContent;

typedef struct {
	bool temp_unit_celsius;
	char date_format[32];
	GColor accent_color;
	TopLeftContent topleft_content;
	bool show_timezone;
	bool show_ampm;
	// New fields appended below to preserve persisted-data compatibility.
	bool show_city;
} Settings;

void settings_init(void);
Settings *settings_get(void);
void settings_save(void);
void settings_apply_from_message(DictionaryIterator *iter);
