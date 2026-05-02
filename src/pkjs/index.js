/**
 * Phone-side proxy and settings handler
 *
 * Uses @moddable/pebbleproxy to forward fetch() and Location requests
 * from the watch through the phone to the internet.
 *
 * IMPORTANT: PKJS in this SDK uses an older JS runtime/bundler.
 * - `fetch` is not available in PKJS (ReferenceError at runtime)
 * - `async`/`await` is not supported by the webpack parser in this toolchain
 *
 * For that reason, weather requests here use XMLHttpRequest + Promise chains.
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

const moddableProxy = require("@moddable/pebbleproxy");

const WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const USE_TEST_LOCATION = false;
const TEST_LOCATION = Object.freeze({
	latitude: 41.505493,
	longitude: -81.681290,
});

function buildCurrentUrl(latitude, longitude) {
	return `${WEATHER_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&hourly=precipitation_probability&forecast_hours=24&daily=sunrise,sunset,temperature_2m_min,temperature_2m_max&forecast_days=1&temperature_unit=fahrenheit&timeformat=unixtime`;
}

function clampInt(value, min, max) {
	const n = Math.round(Number(value) || 0);
	if (n < min) return min;
	if (n > max) return max;
	return n;
}

function makeChunkString(values, start, count) {
	return values.slice(start, start + count).join(",");
}

function requestJSON(url) {
	return new Promise(function(resolve, reject) {
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.onload = function() {
			if (req.status < 200 || req.status >= 300) {
				reject(new Error("HTTP " + req.status + " from " + url));
				return;
			}

			try {
				resolve(JSON.parse(req.responseText));
			} catch (e) {
				reject(new Error("JSON parse failed: " + e));
			}
		};
		req.onerror = function() {
			reject(new Error("XHR failed for " + url));
		};
		req.send();
	});
}

function requestCoordinates() {
	if (USE_TEST_LOCATION) {
		return Promise.resolve({
			latitude: TEST_LOCATION.latitude,
			longitude: TEST_LOCATION.longitude,
		});
	}

	return new Promise(function(resolve, reject) {
		if (!navigator || !navigator.geolocation || !navigator.geolocation.getCurrentPosition) {
			reject(new Error("Geolocation unavailable"));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			function(position) {
				if (!position || !position.coords) {
					reject(new Error("Geolocation returned no coordinates"));
					return;
				}

				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
			function(error) {
				reject(new Error("Geolocation failed: " + JSON.stringify(error)));
			},
			{
				enableHighAccuracy: false,
				timeout: 15000,
				maximumAge: 300000,
			}
		);
	});
}

function sendPayload(payload) {
	Pebble.sendAppMessage(payload,
		function() { console.log("pkjs weather payload sent"); },
		function(err) { console.log("pkjs weather payload failed: " + JSON.stringify(err)); }
	);
}

function fetchAndSendWeather() {
	requestCoordinates()
		.then(function(coords) {
			var weatherUrl = buildCurrentUrl(coords.latitude, coords.longitude);
			console.log("pkjs weather url: " + weatherUrl);
			return requestJSON(weatherUrl);
		})
		.then(function(weatherData) {
			if (!weatherData || !weatherData.current || !weatherData.hourly || !weatherData.hourly.precipitation_probability || !weatherData.daily || !weatherData.daily.sunrise || !weatherData.daily.sunset || !weatherData.daily.temperature_2m_min || !weatherData.daily.temperature_2m_max) {
				sendPayload({ WEATHER_ERROR: 2 });
				return;
			}

			var source = weatherData.hourly.precipitation_probability.slice(0, 24);
			var hourly = source.map(function(value) {
				return clampInt(value, 0, 100);
			});

			while (hourly.length < 24)
				hourly.push(0);

			sendPayload({
				WEATHER_TEMP: clampInt(weatherData.current.temperature_2m, -99, 199),
				WEATHER_TEMP_LOW: clampInt(weatherData.daily.temperature_2m_min[0], -99, 199),
				WEATHER_TEMP_HIGH: clampInt(weatherData.daily.temperature_2m_max[0], -99, 199),
				WEATHER_CODE: clampInt(weatherData.current.weather_code, 0, 99),
				WEATHER_PRECIP_0: makeChunkString(hourly, 0, 8),
				WEATHER_PRECIP_1: makeChunkString(hourly, 8, 8),
				WEATHER_PRECIP_2: makeChunkString(hourly, 16, 8),
				WEATHER_SUNRISE: clampInt(weatherData.daily.sunrise[0], 0, 2147483647),
				WEATHER_SUNSET: clampInt(weatherData.daily.sunset[0], 0, 2147483647),
				WEATHER_ERROR: 0,
			});
		})
		.catch(function(e) {
			console.log("pkjs weather fetch failed: " + e);
			sendPayload({ WEATHER_ERROR: 1 });
		});
}

Pebble.addEventListener("ready", moddableProxy.readyReceived);
Pebble.addEventListener("appmessage", function(e) {
	if (moddableProxy.appMessageReceived(e))
		return;

	if (e && e.payload && e.payload.WEATHER_REQUEST !== undefined)
		fetchAndSendWeather();
});
