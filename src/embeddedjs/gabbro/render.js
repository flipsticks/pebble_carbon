/**
 * Gabbro (Pebble Round 2) render — builds the Application contents tree.
 *
 * All Piu construction for the gabbro platform lives here.  Layout geometry
 * is imported from "layout" (pure constants, no circular dependency risk).
 *
 * ProgressBar is placed FIRST in the array so it renders behind the Column.
 *
 * @module render
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import layout from "layout";
import ClockLabel from "modules/clock";
import DateLabel from "modules/date-label";
import TopWidgetBar from "modules/top-widget-bar";
import BottomWidgetBar from "modules/bottom-widget-bar";
import PrecipGraph from "modules/precip-graph";
import ProgressBar from "modules/progress-bar";

const topWidgetBar    = new TopWidgetBar();
const bottomWidgetBar = new BottomWidgetBar();

/**
 * Returns the Application contents array for the gabbro platform.
 * Arc ProgressBar overlay is placed before the Column so it draws behind.
 *
 * @param {object} $ - Piu template data (widgetConfig) passed from Application.
 * @returns {Array} Piu content array.
 */
export function getContents($) {
	return [
		// Arc progress bar: full-screen Port overlay, drawn behind everything.
		ProgressBar($, {}),
		Column($, {
			top: 0, bottom: 0, left: 0, right: 0,
			contents: [
				// Top widget bar
				topWidgetBar.render($.topWidgets),
				// Precipitation graph
				PrecipGraph($, {}),
				// Clock + date
				Column($, {
					height: layout.center.height, left: 0, right: 0,
					contents: [
						Column(null, {
							top: layout.clock.timeOffset, left: 0, right: 0,
							contents: [
								ClockLabel(null, { left: 0, right: 0 }),
								DateLabel(null,  { top: layout.clock.dateOffset, left: 0, right: 0 }),
							],
						}),
					],
				}),
				// Bottom widget bar
				bottomWidgetBar.render($.bottomWidgets),
			],
		}),
	];
}
