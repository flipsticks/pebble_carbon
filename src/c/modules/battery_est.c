/**
 * Battery runtime estimator
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

#include "battery_est.h"

#define STORAGE_KEY_BATTERY_EST 3

// Seconds-per-percent default used until real discharge data accumulates.
// ~7 days of life for a full charge (7 * 86400 / 100).
#define DEFAULT_SPP 6048
// Clamp measured rates to guard against clock jumps / spurious readings.
#define MIN_SPP 60
#define MAX_SPP 200000

typedef struct {
	uint8_t last_pct;  // percent at the last recorded change
	int32_t spp;       // smoothed discharge rate, seconds per percent
	time_t last_change; // when last_pct was first observed
} BatteryEst;

static BatteryEst s_est;

void battery_est_init(void) {
	BatteryChargeState batt = battery_state_service_peek();
	s_est.last_pct = batt.charge_percent;
	s_est.spp = DEFAULT_SPP;
	s_est.last_change = time(NULL);

	if (persist_exists(STORAGE_KEY_BATTERY_EST)) {
		persist_read_data(STORAGE_KEY_BATTERY_EST, &s_est, sizeof(s_est));
		if (s_est.spp < MIN_SPP || s_est.spp > MAX_SPP)
			s_est.spp = DEFAULT_SPP;
	}
}

void battery_est_update(BatteryChargeState state) {
	time_t now = time(NULL);
	int pct = state.charge_percent;

	if (state.is_charging || state.is_plugged) {
		// Hold the baseline at the current level while powered; don't estimate.
		s_est.last_pct = (uint8_t)pct;
		s_est.last_change = now;
	} else if (pct < s_est.last_pct) {
		// Discharged since the baseline — fold the observed rate into the EMA.
		int dpct = (int)s_est.last_pct - pct;
		long elapsed = (long)(now - s_est.last_change);
		if (elapsed > 0 && dpct > 0) {
			long new_spp = elapsed / dpct;
			if (new_spp < MIN_SPP)
				new_spp = MIN_SPP;
			if (new_spp > MAX_SPP)
				new_spp = MAX_SPP;
			// Weighted average: 3 parts history, 1 part new sample.
			s_est.spp = (int32_t)((s_est.spp * 3 + new_spp) / 4);
		}
		s_est.last_pct = (uint8_t)pct;
		s_est.last_change = now;
	} else if (pct > s_est.last_pct) {
		// Level rose without a charge flag (e.g. recovery) — reset baseline.
		s_est.last_pct = (uint8_t)pct;
		s_est.last_change = now;
	}

	persist_write_data(STORAGE_KEY_BATTERY_EST, &s_est, sizeof(s_est));
}

int32_t battery_est_seconds_remaining(void) {
	BatteryChargeState batt = battery_state_service_peek();
	if (batt.is_charging || batt.is_plugged)
		return -1;
	if (s_est.spp <= 0)
		return -1;
	return (int32_t)batt.charge_percent * s_est.spp;
}
