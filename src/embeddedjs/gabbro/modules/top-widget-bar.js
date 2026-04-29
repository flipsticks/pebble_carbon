/**
 * Gabbro top widget bar
 *
 * Extends WidgetBar with gabbro-specific height, arc-chord inset, background
 * skin, and label style.  The inset trims each side so the slot row fits
 * within the circular screen chord.  Override `render()` here if additional
 * arc-specific geometry is needed beyond the base left/right inset.
 *
 * Slot order (left → right): Battery | Bluetooth | — | —
 *
 * @module modules/top-widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import WidgetBar from "modules/widget-bar";
import assets from "assets";
import layout from "layout";

const topBarSkin  = new Skin(assets.skins.topBar);
const topBarStyle = new Style(assets.styles.icons);

export default class TopWidgetBar extends WidgetBar {
	constructor() {
		const inset = layout.topBar.inset;
		super({
			height:    layout.topBar.height,
			slotWidth: Math.floor((screen.width - inset * 2) / 4),
			skin:      topBarSkin,
			style:     topBarStyle,
			inset,
		});
	}
}
