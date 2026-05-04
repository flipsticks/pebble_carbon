/**
 * Weather graph — 24-hour precipitation bars + temperature line
 *
 * Displays hourly precipitation probability as downward-extending bars and
 * overlays a 24-hour temperature trend line. The temperature line is
 * normalized to the daily low/high temperatures from the weather payload.
 *
 * Uses Piu Port for custom Canvas-based rendering.
 * Subscribes to WeatherObserver for hourly weather data.
 *
 * @module modules/weather-graph
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import { observeWeather, getWeatherSample } from "modules/weather-observer";
import { colors, skins } from "assets";

class WeatherGraphBehavior extends Behavior {
	onCreate(port) {
		this.port = port;
		this.unsubscribe = null;
		this.data = null;
	}

	onDisplaying(port) {
		const self = this;
		this.unsubscribe = observeWeather((sample) => {
			self.data = sample;
			port.invalidate();
		});

		const initial = getWeatherSample();
		if (initial) {
			this.data = initial;
			port.invalidate();
		}
	}

	onUndisplaying(port) {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
		this.data = null;
	}

	drawLine(port, color, x0, y0, x1, y1) {
		if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1))
			return;

		const startX = Math.round(x0);
		const startY = Math.round(y0);
		const endX = Math.round(x1);
		const endY = Math.round(y1);
		const dx = endX - startX;
		const dy = endY - startY;
		const steps = Math.max(Math.abs(dx), Math.abs(dy));

		if (steps === 0) {
			port.fillColor(color, startX, startY, 1, 1);
			return;
		}

		for (let i = 0; i <= steps; i++) {
			const px = Math.round(startX + ((dx * i) / steps));
			const py = Math.round(startY + ((dy * i) / steps));
			port.fillColor(color, px, py, 1, 1);
		}
	}

	onDraw(port, x, y, width, height) {
		const sample = this.data;
		const graphWidth = port.width;
		const graphHeight = port.height;

		port.fillColor(colors.graphBackground, 0, 0, graphWidth, graphHeight);

		if (!sample || !sample.hourly || sample.hourly.length === 0) {
			return;
		}

		const precip = sample.hourly;
		const barCount = Math.min(24, precip.length);
		const graphTop = 2;
		const maxBarHeight = Math.max(1, graphHeight - graphTop);

		for (let i = 0; i < barCount; i++) {
			const prob = precip[i] || 0;
			if (prob <= 0) continue;
			const barHeight = Math.max(1, Math.round((prob / 100) * maxBarHeight));
			const cellLeft = Math.floor((i * graphWidth) / barCount);
			const cellRight = Math.floor(((i + 1) * graphWidth) / barCount);
			const barLeft = cellLeft;
			const barRight = Math.max(barLeft + 1, cellRight - 1);
			const barWidth = Math.max(1, barRight - barLeft);

			port.fillColor(colors.graphBar, barLeft, graphTop, barWidth, barHeight);
		}

		port.fillColor(colors.graphDaylightBg, 0, 0, graphWidth, 2);
		if (sample.sunrise && sample.sunset) {
			const nowSec = Math.floor(Date.now() / 1000);
			const dayStart = ((sample.sunrise - nowSec) / 3600) * (graphWidth / 24);
			const dayEnd = ((sample.sunset - nowSec) / 3600) * (graphWidth / 24);

			const wrap = (value, size) => {
				let out = value % size;
				if (out < 0) out += size;
				return out;
			};

			const start = wrap(dayStart, graphWidth);
			const end = wrap(dayEnd, graphWidth);

			if (start < end) {
				port.fillColor(colors.graphDaylight, start, 0, end - start, 2);
			} else if (start > end) {
				port.fillColor(colors.graphDaylight, 0, 0, end, 2);
				port.fillColor(colors.graphDaylight, start, 0, graphWidth - start, 2);
			}
		}

		const temps = sample.temperatureHourly;
		if (!temps || temps.length === 0)
			return;

		// Use 25 points: current temp at x=0 plus 24 hourly forecast points.
		// This aligns points to precip-bar boundaries and touches both edges.
		const lineTemps = [sample.temperature];
		for (let i = 0; i < 24; i++) {
			lineTemps.push(i < temps.length ? temps[i] : sample.temperature);
		}
		const pointCount = 25;
		const fallbackTemp = Number.isFinite(sample.temperature) ? sample.temperature : 0;
		const low = Number.isFinite(sample.temperatureLow) ? sample.temperatureLow : fallbackTemp;
		const high = Number.isFinite(sample.temperatureHigh) ? sample.temperatureHigh : fallbackTemp;
		const tempMin = Math.min(low, high);
		const tempMax = Math.max(low, high);
		const denom = tempMax - tempMin;
		const lineTop = graphTop;
		const lineBottom = Math.max(lineTop, graphHeight - 1);
		const lineRange = Math.max(1, lineBottom - lineTop);
		let lastX = -1;
		let lastY = -1;

		for (let i = 0; i < pointCount; i++) {
			const temp = lineTemps[i];
			const value = Number.isFinite(temp) ? temp : fallbackTemp;
			const clamped = Math.max(tempMin, Math.min(tempMax, value));
			const normalized = denom === 0 ? 0.5 : (clamped - tempMin) / denom;
			const xPos = Math.floor((i * graphWidth) / 24);
			const xSafe = Math.max(0, Math.min(graphWidth - 1, xPos));
			const yPos = lineBottom - Math.round(normalized * lineRange);
			const ySafe = Math.max(lineTop, Math.min(lineBottom, yPos));

			if (!Number.isFinite(xSafe) || !Number.isFinite(ySafe))
				continue;

			if (lastX >= 0)
				this.drawLine(port, colors.graphTempLine, lastX, lastY, xSafe, ySafe);
			port.fillColor(colors.graphTempLine, xSafe, ySafe, 1, 1);
			lastX = xSafe;
			lastY = ySafe;
		}
	}
}

const WeatherGraphTemplate = Port.template($ => ({
	height: 28,
	left: 0, right: 0,
	skin: skins.graph,
	Behavior: WeatherGraphBehavior,
}));

export default WeatherGraphTemplate;
