import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import app from '../../src/app.ts';
import { build } from '../helper.ts';
import type {} from '../../src/plugins/grandlyon/index.ts';

const availabilities = {
	bikes: 4,
	electricalBikes: 1,
	electricalInternalBatteryBikes: 0,
	electricalRemovableBatteryBikes: 1,
	mechanicalBikes: 3,
	stands: 6,
};
const rawStation = {
	address: null,
	address2: null,
	address_jcd: 'Place des Terreaux',
	availability: 'AVAILABLE',
	availabilitycode: 1,
	available_bike_stands: 6,
	available_bikes: 4,
	banking: true,
	bike_stands: 10,
	bonus: false,
	code_insee: null,
	commune: null,
	description: null,
	enddate: null,
	etat: null,
	gid: 999,
	langue: null,
	last_update: null,
	last_update_fme: null,
	last_update_gl: null,
	lat: 45.76,
	lng: 4.83,
	main_stands: { availabilities, capacity: 10 },
	name: 'Terreaux',
	nature: null,
	nmarrond: null,
	number: 1001,
	overflow: false,
	overflow_stands: null,
	pole: null,
	startdate: null,
	status: 'OPEN',
	titre: null,
	total_stands: { availabilities, capacity: 10 },
};
const response = {
	fields: ['number'],
	layer_name: 'velov',
	nb_results: 1,
	table_alias: null,
	table_href: '/velov',
	values: [rawStation],
};

test('tracking API uses number, preserves live response and keeps failed updates atomic', async (t) => {
	const server = await build(t);
	let calls = 0;
	let unavailable = false;
	server.grandLyonClient.fetch = async <T>() => {
		calls++;
		if (unavailable) throw new Error('private provider details');
		return response as T;
	};
	let result = await server.inject('/velov/tracked-stations');
	assert.equal(result.statusCode, 200);
	assert.deepEqual(result.json(), { stations: [] });
	assert.equal(calls, 0);

	result = await server.inject('/velov');
	assert.equal(result.statusCode, 200);
	assert.deepEqual(result.json(), [
		{
			id: 1001,
			name: 'Terreaux',
			coordinates: { lat: 45.76, lng: 4.83 },
			bikes: { normal: 3, electric: 1 },
			availableSpots: 6,
			address: '',
		},
	]);
	assert.deepEqual(server.velovStore.getTrackedStations(), []);

	const put = (stationIds: unknown) =>
		server.inject({
			method: 'PUT',
			url: '/velov/tracked-stations',
			payload: { stationIds },
		});
	result = await put([1001]);
	assert.equal(result.statusCode, 200);
	const tracked = result.json();
	assert.equal(tracked.stations[0].stationId, 1001);
	assert.ok(!Number.isNaN(Date.parse(tracked.stations[0].trackedSince)));
	assert.deepEqual((await put([1001])).json(), tracked);

	for (const invalid of [
		[999],
		[0],
		[-1],
		[1.2],
		[1001, 1001],
		[null],
		['1001'],
		[Number.MAX_SAFE_INTEGER + 1],
		'1001',
	]) {
		assert.equal((await put(invalid)).statusCode, 400, JSON.stringify(invalid));
		assert.deepEqual((await server.inject('/velov/tracked-stations')).json(), tracked);
	}
	assert.equal(
		(await server.inject({ method: 'PUT', url: '/velov/tracked-stations', payload: {} }))
			.statusCode,
		400,
	);
	unavailable = true;
	result = await put([1001]);
	assert.equal(result.statusCode, 503);
	assert.doesNotMatch(result.body, /private provider/);
	assert.deepEqual((await server.inject('/velov/tracked-stations')).json(), tracked);
	const previousCalls = calls;
	assert.deepEqual((await put([])).json(), { stations: [] });
	assert.equal(calls, previousCalls);
});

test('application closes SQLite and releases the database on shutdown', async () => {
	const server = Fastify();
	await server.register(fp(app), { databasePath: ':memory:' });
	await server.ready();
	const store = server.velovStore;
	assert.deepEqual(store.getTrackedStations(), []);
	await server.close();
	assert.throws(() => store.getTrackedStations());
});
