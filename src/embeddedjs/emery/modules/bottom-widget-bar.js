/**
 * Emery bottom widget bar
 *
 * Extends WidgetBar with emery-specific height and slot configuration.
 * No background skin (transparent).  Slots are ordered left-to-right:
 *   [0] —  [1] —  [2] —  [3] —
 *
 * @module modules/bottom-widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import layout from "layout";
import { WidgetBar } from "modules/widget-bar";

// 4 equal-width slots across the full bar width.
const SLOT_WIDTH = Math.floor(screen.width / 4);

const BottomWidgetBar = WidgetBar.template($ => ({
	height: layout.bottomBar.height,
	left: 0, right: 0,
	slots: $.bottomWidgets,
	slotWidth: SLOT_WIDTH,
}));

export default BottomWidgetBar;
