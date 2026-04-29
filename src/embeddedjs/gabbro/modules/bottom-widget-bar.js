/**
 * Gabbro bottom widget bar — STUB
 *
 * Placeholder until arc-chord slot layout is implemented for the circular
 * screen.  Uses a plain Content sized to the correct height.
 *
 * @module modules/bottom-widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import layout from "layout";

const BottomWidgetBar = Content.template($ => ({
	height: layout.bottomBar.height,
	left: 0, right: 0,
}));

export default BottomWidgetBar;
