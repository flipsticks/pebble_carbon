/**
 * WidgetBar base class
 *
 * A Row template that renders an ordered list of widget slots.  Each entry in
 * `$.slots` is either a slot descriptor `{ name, config }` or `null` (spacer).
 *
 *   name   — widget module name, no path prefix (e.g. `"battery"`).  The
 *             `"widgets/"` prefix is added here so callers cannot inject an
 *             arbitrary module path.
 *   config — passed as instance data to the widget template constructor.
 *
 * Modules are loaded on demand with `importNow()` so unused widgets never
 * occupy memory.
 *
 * Platform files extend this by supplying `height`, optional `skin`, and
 * `slots` (mapped from the app-level `widgetConfig`).  Pass `slotWidth` to
 * override the default per-slot width.
 *
 * @module widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

const DEFAULT_SLOT_WIDTH = 40;

/**
 * Builds a fixed-width slot Content wrapping an on-demand-loaded widget.
 * Returns a plain spacer when `spec` is null.
 */
function makeSlot(spec, slotWidth, height) {
	if (!spec) {
		return Content(null, { width: slotWidth, height });
	}
	const Widget = importNow("widgets/" + spec.name).default;
	return Content(null, {
		width: slotWidth, height,
		contents: [ Widget(spec.config || null, {}) ],
	});
}

export const WidgetBar = Row.template($ => ({
	contents: ($.slots || []).map(spec =>
		makeSlot(spec, $.slotWidth || DEFAULT_SLOT_WIDTH, $.height)
	),
}));
