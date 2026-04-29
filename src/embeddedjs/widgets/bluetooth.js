/**
 * Bluetooth widget
 *
 * Displays a bluetooth connected/disconnected icon.
 * Listens for `onBluetoothChanged` events distributed from the app behavior.
 *
 * @todo Add option for "disconnected" icon to show only when disconnected, rather than always showing an icon with different states.
 *
 * @module widgets/bluetooth
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import icons, { IconLabel } from "modules/icons";

class BluetoothBehavior extends Behavior {
	onCreate(label, data) {
		label.string = watch.bluetooth.connected ? icons.bluetooth : icons.bluetoothOff;
		watch.bluetooth.addEventListener("connectionchange", (e) => {
			label.string = e.connected ? icons.bluetooth : icons.bluetoothOff;
		});
	}
}

const BluetoothWidget = IconLabel.template($ => ({
	Behavior: BluetoothBehavior,
	string: icons.bluetooth,
}));

export default BluetoothWidget;
