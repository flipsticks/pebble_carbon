/**
 * Gabbro top widget bar — STUB
 *
 * Placeholder until arc-chord slot layout is implemented for the circular
 * screen.  Uses a plain Content sized to the correct height.
 *
 * @module modules/top-widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import assets from "assets";
import layout from "layout";

const topBarSkin = new Skin(assets.skins.topBar);

const TopWidgetBar = Content.template($ => ({
	height: layout.topBar.height,
	left: 0, right: 0,
	skin: topBarSkin,
}));

export default TopWidgetBar;
