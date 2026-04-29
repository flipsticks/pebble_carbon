/**
 * Emery top widget bar
 *
 * Extends WidgetBar with emery-specific height, background skin, and the
 * initial slot configuration.  Slots are module specifier strings loaded
 * on demand via `importNow()`.  Use `null` for an empty slot.
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

import assets from "assets";
import layout from "layout";
import { WidgetBar } from "modules/widget-bar";

const topBarSkin = new Skin(assets.skins.topBar);

// 4 equal-width slots across the full bar width.
const SLOT_WIDTH = Math.floor(screen.width / 4);

const TopWidgetBar = WidgetBar.template($ => ({
	height: layout.topBar.height,
	left: 0, right: 0,
	skin: topBarSkin,
	slots: $.topWidgets,
	slotWidth: SLOT_WIDTH,
}));

export default TopWidgetBar;
