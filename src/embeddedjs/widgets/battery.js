/**
 * Battery widget
 *
 * Displays a battery icon reflecting the current charge level and charging
 * state.  Listens for `watch.battery` updates via `onBatteryChanged`.
 *
 * @todo Implement battery percentage text option (requires font with % glyph, or custom text layout).
 *
 * @module widgets/battery
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import icons, { IconLabel } from "modules/icons";

function batteryIcon(state) {
	if (state.charging)     return icons.batteryCharging;
	if (state.percent > 80) return icons.batteryFull;
	if (state.percent > 40) return icons.batteryMedium;
	if (state.percent > 20) return icons.batteryLow;
	return icons.batteryWarning;
}

class BatteryBehavior extends Behavior {
	onCreate(label, data) {
		label.string = batteryIcon(watch.battery);
		watch.battery.addEventListener("change", (e) => {
			label.string = batteryIcon(e);
		});
	}
}

const BatteryWidget = IconLabel.template($ => ({
	Behavior: BatteryBehavior,
	string: icons.battery,
}));

export default BatteryWidget;
