/**
 * Gabbro bottom widget bar
 *
 * Extends WidgetBar with gabbro-specific height and arc-chord inset.  No
 * background skin (transparent).  Override `render()` here if additional
 * arc-specific geometry is needed beyond the base left/right inset.
 *
 * @module modules/bottom-widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import WidgetBar from "modules/widget-bar";
import assets from "assets";
import layout from "layout";

const bottomBarStyle = new Style(assets.styles.icons);

export default class BottomWidgetBar extends WidgetBar {
	constructor() {
		const inset = layout.bottomBar.inset;
		super({
			height:    layout.bottomBar.height,
			slotWidth: Math.floor((screen.width - inset * 2) / 4),
			style:     bottomBarStyle,
			inset,
		});
	}
}
