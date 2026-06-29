/**
 * Time layer
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

#include "time_layer.h"
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct TimeLayer {
	Layer *container;
	TextLayer *city_label;
	TextLayer *time_label;
	TextLayer *tz_label;   // timezone abbreviation, left of time
	TextLayer *ampm_label; // AM/PM indicator, right of time (12h only)
	TextLayer *date_label;
	char city_buf[24];
	char time_buf[8];
	char tz_buf[8];
	char tz_override[8]; // set by time_layer_set_timezone; overrides strftime
	char ampm_buf[4];
	char date_buf[32];
	// Stacked-letter render buffers for the vertical side labels. Sized to hold
	// each source character followed by a newline separator.
	char tz_stacked[16];
	char ampm_stacked[8];
	// Side-column geometry, computed once in create().
	int side_left_x;
	int side_right_x;
	int side_col_w;
	int side_center_y;
	// Container dimensions, for responsive re-layout in prv_relayout().
	int frame_w;
	int frame_h;
};

// Copy src into dst inserting a newline between each character so a TextLayer
// renders the text vertically (one glyph per line). e.g. "AEST" -> "A\nE\nS\nT".
static void prv_stack_vertical(const char *src, char *dst, size_t dst_len) {
	size_t di = 0;
	for (size_t si = 0; src[si] && di + 2 < dst_len; si++) {
		if (di > 0)
			dst[di++] = '\n';
		dst[di++] = src[si];
	}
	dst[di] = '\0';
}

// Size a vertical side label to exactly fit its stacked text and re-center it on
// the time digits, so longer abbreviations (e.g. "AEST") never get clipped.
static void prv_position_side(TimeLayer *tl, TextLayer *lbl, const char *text,
                              int x) {
	GFont font = fonts_get_system_font(FONT_KEY_GOTHIC_14);
	GSize sz = graphics_text_layout_get_content_size(
	    text, font, GRect(0, 0, tl->side_col_w, 200),
	    GTextOverflowModeWordWrap, GTextAlignmentCenter);
	int h = sz.h > 0 ? sz.h : 1;
	layer_set_frame(text_layer_get_layer(lbl),
	                GRect(x, tl->side_center_y - h / 2, tl->side_col_w, h + 2));
}

// Re-flow the city / time / date stack so the visible elements are centered in
// the block and the clock grows to fill space freed by hidden rows. The time
// font tier is chosen by how many of {city, date} are shown (2/1/0). Also
// updates side_center_y so the vertical TZ/AM-PM columns track the digits.
static void prv_relayout(TimeLayer *tl, bool show_city, bool show_date) {
	int n = (show_city ? 1 : 0) + (show_date ? 1 : 0);
	const char *font_key;
	int time_h, time_pad;
	if (n >= 2) {
		font_key = TL_TIME_FONT_KEY2;
		time_h = TL_TIME_H2;
		time_pad = TL_TIME_PAD2;
	} else if (n == 1) {
		font_key = TL_TIME_FONT_KEY1;
		time_h = TL_TIME_H1;
		time_pad = TL_TIME_PAD1;
	} else {
		font_key = TL_TIME_FONT_KEY0;
		time_h = TL_TIME_H0;
		time_pad = TL_TIME_PAD0;
	}

	int w = tl->frame_w;
	int time_vis_h = time_h - time_pad; // visible digit band
	int city_vh = show_city ? TL_SMALL_H : 0;
	int date_vh = show_date ? TL_SMALL_H : 0;
	int total = city_vh + time_vis_h + date_vh;
	int y = (tl->frame_h - total) / 2;
	if (y < 0)
		y = 0;

	layer_set_hidden(text_layer_get_layer(tl->city_label), !show_city);
	if (show_city) {
		layer_set_frame(text_layer_get_layer(tl->city_label),
		                GRect(0, y, w, TL_SMALL_H));
		y += TL_SMALL_H;
	}

	int time_vis_top = y;
	text_layer_set_font(tl->time_label, fonts_get_system_font(font_key));
	layer_set_frame(text_layer_get_layer(tl->time_label),
	                GRect(0, time_vis_top - time_pad, w, time_h));
	y += time_vis_h;

	layer_set_hidden(text_layer_get_layer(tl->date_label), !show_date);
	if (show_date) {
		layer_set_frame(text_layer_get_layer(tl->date_label),
		                GRect(0, y, w, TL_SMALL_H));
	}

	tl->side_center_y = time_vis_top + time_vis_h / 2;
}

static void prv_remove_leading_zero(char *buf, size_t len) {
	bool prev_nondigit = true;
	size_t i = 0;
	while (buf[i]) {
		if (buf[i] == '0' && prev_nondigit) {
			memmove(&buf[i], &buf[i + 1], len - i - 1);
		} else {
			prev_nondigit = !(buf[i] >= '0' && buf[i] <= '9');
			i++;
		}
	}
}

TimeLayer *time_layer_create(GRect frame) {
	TimeLayer *tl = malloc(sizeof(TimeLayer));
	if (!tl)
		return NULL;

	tl->city_buf[0] = '\0';
	tl->time_buf[0] = '\0';
	tl->tz_buf[0] = '\0';
	tl->tz_override[0] = '\0';
	tl->ampm_buf[0] = '\0';
	tl->date_buf[0] = '\0';
	tl->tz_stacked[0] = '\0';
	tl->ampm_stacked[0] = '\0';

	tl->container = layer_create(frame);
	int w = frame.size.w;
	tl->frame_w = frame.size.w;
	tl->frame_h = frame.size.h;

	// City name — top, small font, full width centered
	GFont city_font = fonts_get_system_font(TL_SMALL_FONT_KEY);
	tl->city_label = text_layer_create(GRect(0, 0, w, TL_SMALL_H));
	text_layer_set_background_color(tl->city_label, GColorClear);
	text_layer_set_text_color(tl->city_label, GColorWhite);
	text_layer_set_font(tl->city_label, city_font);
	text_layer_set_text_alignment(tl->city_label, GTextAlignmentCenter);
	text_layer_set_text(tl->city_label, tl->city_buf);
	layer_add_child(tl->container, text_layer_get_layer(tl->city_label));

	// Time — large centered. LECO_60 on emery (>=228px); LECO_36_BOLD
	// everywhere else. TL_TIME_PAD is the internal top gap measured from each
	// font's line metrics.
	GFont time_font = fonts_get_system_font(TL_TIME_FONT_KEY);
	// Shift the time label up by TL_TIME_PAD so visible digits start flush with
	// city text
	int time_y = TL_SMALL_H - TL_TIME_PAD;
	tl->time_label = text_layer_create(GRect(0, time_y, w, TL_TIME_H));
	text_layer_set_background_color(tl->time_label, GColorClear);
	text_layer_set_text_color(tl->time_label, GColorWhite);
	text_layer_set_font(tl->time_label, time_font);
	text_layer_set_text_alignment(tl->time_label, GTextAlignmentCenter);
	text_layer_set_text(tl->time_label, tl->time_buf);
	layer_add_child(tl->container, text_layer_get_layer(tl->time_label));

	// Timezone & AM/PM — vertical stacked-letter columns flanking the time. Each
	// is one glyph wide; the column is auto-sized to its text and centered on the
	// visible digits (see prv_position_side) so longer abbreviations like "AEST"
	// are never clipped.
	GFont small_font = fonts_get_system_font(FONT_KEY_GOTHIC_14);
	tl->side_col_w = TL_SIDE_COL_W;
	tl->side_left_x = 2;
	tl->side_right_x = w - 2 - TL_SIDE_COL_W;
	tl->side_center_y = TL_SMALL_H + (TL_TIME_H - TL_TIME_PAD) / 2;

	// Timezone — left edge
	tl->tz_label = text_layer_create(GRect(tl->side_left_x, 0, TL_SIDE_COL_W, 1));
	text_layer_set_background_color(tl->tz_label, GColorClear);
	text_layer_set_text_color(tl->tz_label, GColorLightGray);
	text_layer_set_font(tl->tz_label, small_font);
	text_layer_set_text_alignment(tl->tz_label, GTextAlignmentCenter);
	text_layer_set_text(tl->tz_label, tl->tz_stacked);
	layer_add_child(tl->container, text_layer_get_layer(tl->tz_label));

	// AM/PM — right edge
	tl->ampm_label =
	    text_layer_create(GRect(tl->side_right_x, 0, TL_SIDE_COL_W, 1));
	text_layer_set_background_color(tl->ampm_label, GColorClear);
	text_layer_set_text_color(tl->ampm_label, GColorLightGray);
	text_layer_set_font(tl->ampm_label, small_font);
	text_layer_set_text_alignment(tl->ampm_label, GTextAlignmentCenter);
	text_layer_set_text(tl->ampm_label, tl->ampm_stacked);
	layer_add_child(tl->container, text_layer_get_layer(tl->ampm_label));

	// Date — below time
	int date_y = time_y + TL_TIME_H;
	GFont date_font = fonts_get_system_font(TL_SMALL_FONT_KEY);
	tl->date_label = text_layer_create(GRect(0, date_y, w, TL_SMALL_H));
	text_layer_set_background_color(tl->date_label, GColorClear);
	text_layer_set_text_color(tl->date_label, GColorWhite);
	text_layer_set_font(tl->date_label, date_font);
	text_layer_set_text_alignment(tl->date_label, GTextAlignmentCenter);
	text_layer_set_text(tl->date_label, tl->date_buf);
	layer_add_child(tl->container, text_layer_get_layer(tl->date_label));

	return tl;
}

void time_layer_destroy(TimeLayer *layer) {
	if (!layer)
		return;
	text_layer_destroy(layer->date_label);
	text_layer_destroy(layer->ampm_label);
	text_layer_destroy(layer->tz_label);
	text_layer_destroy(layer->time_label);
	text_layer_destroy(layer->city_label);
	layer_destroy(layer->container);
	free(layer);
}

Layer *time_layer_get_layer(TimeLayer *layer) {
	return layer ? layer->container : NULL;
}

void time_layer_set_timezone(TimeLayer *layer, const char *tz) {
	if (!layer || !tz)
		return;
	strncpy(layer->tz_override, tz, sizeof(layer->tz_override) - 1);
	layer->tz_override[sizeof(layer->tz_override) - 1] = '\0';
	// Immediately update the label so it shows even before the next tick
	prv_stack_vertical(layer->tz_override[0] ? layer->tz_override
	                                         : layer->tz_buf,
	                   layer->tz_stacked, sizeof(layer->tz_stacked));
	text_layer_set_text(layer->tz_label, layer->tz_stacked);
	prv_position_side(layer, layer->tz_label, layer->tz_stacked,
	                  layer->side_left_x);
}

void time_layer_set_city(TimeLayer *layer, const char *city) {
	if (!layer || !city)
		return;
	strncpy(layer->city_buf, city, sizeof(layer->city_buf) - 1);
	layer->city_buf[sizeof(layer->city_buf) - 1] = '\0';
	text_layer_set_text(layer->city_label, layer->city_buf);
}

void time_layer_update(TimeLayer *layer, struct tm *tick_time,
                       const Settings *settings) {
	if (!layer || !tick_time || !settings)
		return;

	// Re-flow the city / time / date stack for the current visibility, growing
	// the clock into any space freed by hidden rows.
	prv_relayout(layer, settings->show_city, settings->show_date);

	bool is_24h = clock_is_24h_style();

	// Time string
	if (is_24h) {
		strftime(layer->time_buf, sizeof(layer->time_buf), "%H:%M", tick_time);
		strncpy(layer->ampm_buf, "24h", sizeof(layer->ampm_buf) - 1);
		layer->ampm_buf[sizeof(layer->ampm_buf) - 1] = '\0';
	} else {
		// 12h: format and strip leading zero
		char tmp[8];
		strftime(tmp, sizeof(tmp), "%I:%M", tick_time);
		const char *src = (tmp[0] == '0') ? tmp + 1 : tmp;
		strncpy(layer->time_buf, src, sizeof(layer->time_buf) - 1);
		layer->time_buf[sizeof(layer->time_buf) - 1] = '\0';
		// AM/PM
		strftime(layer->ampm_buf, sizeof(layer->ampm_buf), "%p", tick_time);
	}
	text_layer_set_text(layer->time_label, layer->time_buf);
	// Apply the accent color to the time digits (defaults to white).
	text_layer_set_text_color(layer->time_label, settings->accent_color);
	prv_stack_vertical(layer->ampm_buf, layer->ampm_stacked,
	                   sizeof(layer->ampm_stacked));
	text_layer_set_text(layer->ampm_label, layer->ampm_stacked);
	prv_position_side(layer, layer->ampm_label, layer->ampm_stacked,
	                  layer->side_right_x);
	layer_set_hidden(text_layer_get_layer(layer->ampm_label),
	                 !settings->show_ampm);

	// Timezone abbreviation — use manual override if set (e.g. demo mode),
	// otherwise derive from strftime and hide numeric offsets or empty values.
	if (layer->tz_override[0]) {
		prv_stack_vertical(layer->tz_override, layer->tz_stacked,
		                   sizeof(layer->tz_stacked));
	} else {
		strftime(layer->tz_buf, sizeof(layer->tz_buf), "%Z", tick_time);
		bool tz_valid = (layer->tz_buf[0] >= 'A' && layer->tz_buf[0] <= 'Z') &&
		                (layer->tz_buf[1] >= 'A' && layer->tz_buf[1] <= 'Z');
		prv_stack_vertical(tz_valid ? layer->tz_buf : "", layer->tz_stacked,
		                   sizeof(layer->tz_stacked));
	}
	text_layer_set_text(layer->tz_label, layer->tz_stacked);
	prv_position_side(layer, layer->tz_label, layer->tz_stacked,
	                  layer->side_left_x);
	layer_set_hidden(text_layer_get_layer(layer->tz_label),
	                 !settings->show_timezone);

	// Date — format string stored in settings; leading zeros stripped
	// automatically.
	strftime(layer->date_buf, sizeof(layer->date_buf), settings->date_format,
	         tick_time);
	prv_remove_leading_zero(layer->date_buf, sizeof(layer->date_buf));
	text_layer_set_text(layer->date_label, layer->date_buf);
}
