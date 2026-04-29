/**
 * Gabbro (Pebble Round 2) layout constants.
 *
 * Pure data — no Piu imports.  Other modules import this for section
 * heights and arc-inset values.  Piu construction lives in render.js.
 *
 * @module layout
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

// Arc-inset helper
//
// For a horizontal bar centred at yc, the usable half-chord is:
//   half-chord = sqrt(r² – |r – yc|²)
//   inset      = r – half-chord   (pixels trimmed from each side)

const r = screen.width / 2; // 130 on gabbro (260×260)

function arcInset(barY, barH) {
	const yCenter = barY + barH / 2;
	const yDist   = Math.abs(r - yCenter);
	return Math.ceil(r - Math.sqrt(Math.max(0, r * r - yDist * yDist)));
}

// Section heights
//
// On gabbro (260×260), bars are 36 px tall.
//   r = 130, barCenter = 18 → yDist = 112 → half-chord ≈ 66 → inset ≈ 64 px
//   usable width per bar ≈ 132 px (enough for 4 widget slots)
const TOP_BAR_HEIGHT    = 36;
const PRECIP_HEIGHT     = 30;
const BOTTOM_BAR_HEIGHT = 36;
const PROGRESS_HEIGHT   = 4; // kept for layout.progressBar consumers; not used in column height

// ProgressBar is an overlay, not a Column child — no PROGRESS_HEIGHT deducted.
const CENTER_HEIGHT = screen.height - TOP_BAR_HEIGHT - PRECIP_HEIGHT - BOTTOM_BAR_HEIGHT;

const BOTTOM_BAR_Y = screen.height - BOTTOM_BAR_HEIGHT;

// Clock centering
const CLOCK_BLOCK_H = 150;

// Frozen layout constants
const layout = Object.freeze({
	isRound: true,
	topBar: Object.freeze({
		height: TOP_BAR_HEIGHT,
		inset:  arcInset(0, TOP_BAR_HEIGHT),
	}),
	precipGraph: Object.freeze({
		height: PRECIP_HEIGHT,
	}),
	center: Object.freeze({
		height: CENTER_HEIGHT,
	}),
	bottomBar: Object.freeze({
		height: BOTTOM_BAR_HEIGHT,
		inset:  arcInset(BOTTOM_BAR_Y, BOTTOM_BAR_HEIGHT),
	}),
	progressBar: Object.freeze({
		height: PROGRESS_HEIGHT,
	}),
	clock: Object.freeze({
		blockHeight: CLOCK_BLOCK_H,
		timeOffset:  Math.max(0, Math.floor((CENTER_HEIGHT - CLOCK_BLOCK_H) / 2)),
		dateOffset:  -8,
	}),
});

export default layout;
