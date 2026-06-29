/**
 * Time layer
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

#pragma once
#include "../modules/settings.h"
#include <pebble.h>

// Time block layout constants — all tweakable values live here.
// City and date always share the same font and height.
#if PBL_DISPLAY_HEIGHT <= 168
#define TL_SMALL_FONT_KEY FONT_KEY_GOTHIC_14
#define TL_SMALL_H 16
// Enlarged city/date used in fill mode (when a row is hidden) so the remaining
// secondary text grows along with the clock.
#define TL_SMALL_BIG_FONT_KEY FONT_KEY_GOTHIC_24_BOLD
#define TL_SMALL_BIG_H 28
#else
#define TL_SMALL_FONT_KEY FONT_KEY_GOTHIC_18
#define TL_SMALL_H 22
#define TL_SMALL_BIG_FONT_KEY FONT_KEY_GOTHIC_28_BOLD
#define TL_SMALL_BIG_H 34
#endif
// Time-font tiers, chosen by how many of {city, date} are visible so the clock
// fills the freed space: TIER2 = both shown (default), TIER1 = one hidden,
// TIER0 = both hidden. TL_TIME_PAD* is each font's internal top gap (the empty
// band above the digits), measured from its line metrics.
// LECO_60 on emery (>=228px) is already the largest numbers font, so its tiers
// share one size and only re-center.
#if PBL_DISPLAY_HEIGHT >= 228
#define TL_TIME_FONT_KEY2 FONT_KEY_LECO_60_NUMBERS_AM_PM
#define TL_TIME_H2 62
#define TL_TIME_PAD2 14
#define TL_TIME_FONT_KEY1 TL_TIME_FONT_KEY2
#define TL_TIME_H1 TL_TIME_H2
#define TL_TIME_PAD1 TL_TIME_PAD2
#define TL_TIME_FONT_KEY0 TL_TIME_FONT_KEY2
#define TL_TIME_H0 TL_TIME_H2
#define TL_TIME_PAD0 TL_TIME_PAD2
#else
#define TL_TIME_FONT_KEY2 FONT_KEY_LECO_36_BOLD_NUMBERS
#define TL_TIME_H2 40
#define TL_TIME_PAD2 4
#define TL_TIME_FONT_KEY1 FONT_KEY_LECO_38_BOLD_NUMBERS
#define TL_TIME_H1 43
#define TL_TIME_PAD1 4
#define TL_TIME_FONT_KEY0 FONT_KEY_LECO_42_NUMBERS
#define TL_TIME_H0 48
#define TL_TIME_PAD0 6
#endif
// Default tier (both rows visible) — used for create() and block sizing.
#define TL_TIME_FONT_KEY TL_TIME_FONT_KEY2
#define TL_TIME_H TL_TIME_H2
#define TL_TIME_PAD TL_TIME_PAD2
// Height of the TZ / AM-PM labels (GOTHIC_14, constant across platforms)
#define TL_TZ_H 18
// Width of the vertical (stacked-letter) TZ / AM-PM side columns. One GOTHIC_14
// glyph wide; the letters stack down the column flanking the time digits.
#define TL_SIDE_COL_W 14
// Total visible block height used by main.c to size the layer frame.
// Derived automatically so it can never fall out of sync with the values above.
#define TL_TIME_BLOCK_H ((TL_SMALL_H - TL_TIME_PAD) + TL_TIME_H + TL_SMALL_H)

typedef struct TimeLayer TimeLayer;

TimeLayer *time_layer_create(GRect frame);
void time_layer_destroy(TimeLayer *layer);
Layer *time_layer_get_layer(TimeLayer *layer);
void time_layer_set_city(TimeLayer *layer, const char *city);
// Override the timezone abbreviation shown left of the clock. Pass an empty
// string to revert to the system-derived value from strftime.
void time_layer_set_timezone(TimeLayer *layer, const char *tz);
// settings is used for date_format only; 24h is read from clock_is_24h_style()
void time_layer_update(TimeLayer *layer, struct tm *tick_time,
                       const Settings *settings);
