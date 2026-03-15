/**
 * Because Nothing can be perfect
**/

import { Client, Light } from 'lifx-lan-client';
import { EventEmitter } from 'eventemitter3'

class LifxClient extends Client {
	lightAddresses!: Array<string>;

	stopDiscovery() {
		super.stopDiscovery();
		((this as unknown) as EventEmitter).emit('discovery-stop');
	}

	startDiscovery(lights: any) {
		super.startDiscovery(lights);
		((this as unknown) as EventEmitter).emit('discovery-start');
	}

	destroy(): void {
		((this as unknown) as EventEmitter).removeAllListeners();
		super.destroy();
	}
};

class LLight extends Light {
	id!: string;
	label!: string;
	address!: string;
};

interface LColor {
	hue: number,
	saturation: number,
	brightness: number,
	kelvin: number,
}

interface LState {
	color: LColor,
	power: number,
	label: string,
}

export {
	LifxClient,
	LLight,
	LColor,
	LState,
};
