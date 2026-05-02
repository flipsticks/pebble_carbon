/**
 * LazyObserver
 *
 * Reusable base for resource-backed observers (sensor/event sources) that
 * should only be active while one or more consumers are subscribed.
 *
 * Subclasses implement `onStart()` and `onStop()`, and call `publish(value)`
 * whenever new data is available.
 *
 * @module modules/lazy-observer
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

export default class LazyObserver {
	constructor() {
		this._observers = [];
		this._value = null;
		this._active = false;
	}

	get value() {
		return this._value;
	}

	publish(value) {
		this._value = value;
		for (let i = 0; i < this._observers.length; i++) {
			const observer = this._observers[i];
			if (observer)
				observer(value);
		}
	}

	observe(observer) {
		if (this._observers.indexOf(observer) < 0)
			this._observers.push(observer);

		if (!this._active) {
			this._active = true;
			this.onStart();
		}

		if (this._value !== null)
			observer(this._value);

		return () => {
			const index = this._observers.indexOf(observer);
			if (index >= 0)
				this._observers.splice(index, 1);

			if (!this._observers.length && this._active) {
				this._active = false;
				this.onStop();
				this._value = null;
			}
		};
	}

	// Subclass hook: allocate/start source.
	onStart() {}

	// Subclass hook: teardown/stop source.
	onStop() {}
}

Object.freeze(LazyObserver);
