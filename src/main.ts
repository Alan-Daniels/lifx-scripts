import { EventEmitter } from 'eventemitter3'
import { LifxClient, LLight, LColor, LState } from './overrides'
import { ArgsParser } from "argparse-ts";

const client = new LifxClient();
const emitter = ((client as unknown) as EventEmitter);

const parser = new ArgsParser({
	name: "lifx-scripts",
	version: '0.0.1',
}, [
	{
		name: 'command',
		description: 'Command to run',
		type: 'string',
		choices: ['list', 'sunrise', 'sunset'],
	},
	{
		name: '--status',
		description: 'filter results by status',
		type: 'string',
		choices: ['', 'on', 'off'],
		default: '',
		nargs: '?',
	},
	{
		name: '--maxwait',
		description: 'max time in ms to wait for all addresses to respond',
		type: 'number',
		default: 3000,
		nargs: '?',
	},
	{
		name: '--addresses',
		alias: '-a',
		description: 'known ipv4 addresses to check',
		type: 'string',
		nargs: '*',
	}
]);
parser.addVersionAction('--version', '-v');
parser.addHelpAction('--help', '-h');

const args = parser.parse(process.argv.slice(2));

// this is probably dumb
// do we need to worry about mutexes in js?
var waiting = 0;

const sunrise1 = (light: LLight) => {
	const next = sunrise2(light);
	light.color(
		0, // hue
		0, // saturation
		1, // brightness
		2500, // Kelvin
		0, // instantly
		next,
	)
};
const sunrise2 = (light: LLight) => {
	const next = sunrise3(light);
	return (error: any | null) => {
		if (error !== null) {
			next(error);
		} else {
			light.on(0, next)
		}
	};
};
const sunrise3 = (light: LLight) => {
	const next = sunrise4(light);
	return (error: any | null) => {
		if (error !== null) {
			console.error(error, light.id);
			// presumably just drop...
		} else {
			light.color(
				0, // hue
				0, // saturation
				100, // brightness
				3300, // Kelvin
				// 5 * 60 * 1000, // 5 minutes in ms
				3000,
				next,
			)
		}
	}
}
const sunrise4 = (light: LLight) => {
	waiting += 1;
	return (error: any | null) => {
		if (error !== null) {
			console.error(error, light.id);
			// presumably just drop...
		} else {
			console.log("Done!");
		}
		waiting -= 1;
	}
}

emitter.on('discovery-stop', () => {
	switch (args.positional.command) {
		case 'list':
			for (const [_, value] of Object.entries(client.lights(args.options.status))) {
				console.log(`${(value as LLight).id}: ${(value as LLight).label}`);
			}
			break;
		case 'sunrise':
			for (const [_, value] of Object.entries(client.lights(args.options.status))) {
				sunrise1(value as LLight);
			}
			break;
		case 'sunset':
			console.warn('todo');
			break;
	}

	const waiter = () => {
		if (waiting > 0) {
			setTimeout(waiter, 100);
		} else {
			client.destroy();
		}
	};
	waiter();
});

client.init({
	lights: args.options.addresses,
	stopAfterDiscovery: true,
	discoveryInterval: 250,
}, () => {
	setTimeout(() => {
		client.stopDiscovery();
	}, (args.options.maxwait as number))
});
