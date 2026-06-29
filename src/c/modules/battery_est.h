/**
 * Battery runtime estimator
 *
 * The Pebble SDK exposes only the current charge percentage, not a time-
 * remaining estimate. This module derives one by tracking the observed
 * discharge rate (seconds per percent) across readings and persisting it so an
 * estimate is available immediately after a restart.
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

#pragma once
#include <pebble.h>

// Load the persisted discharge model and seed the baseline from the current
// battery level. Call once at startup.
void battery_est_init(void);

// Fold a new battery reading into the discharge model. Call from the battery
// state service handler.
void battery_est_update(BatteryChargeState state);

// Estimated seconds of charge remaining, or -1 when unknown or while
// charging/plugged in.
int32_t battery_est_seconds_remaining(void);
