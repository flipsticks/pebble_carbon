/**
 * Main Carbon watchface entry point.
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import assets from "assets";
import ClockLabel from "clock";
import icons, { IconLabel } from "icons";

const blackSkin = new Skin(assets.skins.black);

const TEST_ICONS = [
	icons.sun,
	icons.cloudRain,
	icons.bluetooth,
	icons.heartPulse,
	icons.battery,
];

//
// Behaviors
//

/**
 * Application behavior.
 *
 * Listens for `minutechange` events and updates the time.
 */
class CarbonBehavior extends Behavior {
	onCreate(app, data) {
		this.data = data;
		watch.addEventListener("minutechange", (e) => {
			app.distribute("onClockChanged", e.date);
		});
	}
}

//
// Application
//

const CarbonApplication = Application.template($ => ({
	skin: blackSkin,
	Behavior: CarbonBehavior,
	contents: [
		Column($, {
			top: 0, bottom: 0, left: 0, right: 0,
			contents: [
				ClockLabel($, {
					left: 0, right: 0,
				}),
				Row($, {
					left: 0, right: 0,
					contents: TEST_ICONS.map(char =>
						IconLabel($, { string: char })
					),
				}),
			],
		}),
	],
}));

export default new CarbonApplication(null, {
	displayListLength: 2048,
	touchCount: 0,
	pixels: screen.width * 4,
});
