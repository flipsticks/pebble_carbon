/**
 * Battery observer
 *
 * Shared, lazy battery sensor manager for widgets and features that need the
 * current battery sample. The underlying Battery sensor is created only when
 * the first observer subscribes, and is closed as soon as the last observer
 * unsubscribes.
 *
 * This keeps the runtime cost at zero when no battery-driven feature is
 * active, while still allowing multiple consumers to share one sensor.
 *
 * @module modules/battery-observer
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import Battery from "embedded:sensor/Battery";
import LazyObserver from "modules/lazy-observer";

class BatteryObserver extends LazyObserver {
	constructor() {
		super();
		this.lastPercent = -1;
		this.lastCharging = undefined;
	}

	publishIfChanged(sample) {
		const percent = Math.round(sample.percent);
		const charging = !!sample.charging;

		if (percent === this.lastPercent && charging === this.lastCharging)
			return;

		this.lastPercent = percent;
		this.lastCharging = charging;
		this.publish(sample);
	}

	onStart() {
		const observer = this;
		this.sensor = new Battery({
			onSample() {
				observer.publishIfChanged(this.sample());
			},
		});

		this.publishIfChanged(this.sensor.sample());
	}

	onStop() {
		if (this.sensor) {
			this.sensor.close();
			this.sensor = null;
		}

		this.lastPercent = -1;
		this.lastCharging = undefined;
	}
}

const batteryObserver = new BatteryObserver();

Object.freeze(BatteryObserver);

export function observeBattery(observer) {
	return batteryObserver.observe(observer);
}

export function getBatterySample() {
	return batteryObserver.value;
}
