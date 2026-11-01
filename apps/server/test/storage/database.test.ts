import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../../src/storage/database.ts';
import { migrations, migrate } from '../../src/storage/migrations.ts';
import { createStationStore } from '../../src/storage/stations.ts';
import type { Station } from '../../src/velov/contracts.ts';

const station: Station = {
	id: 1001,
	name: 'Terreaux',
	address: null,
	latitude: 45.76,
	longitude: 4.83,
	status: null,
	capacity: null,
	source: 'grandlyon-live',
	sourceUpdatedAt: null,
	collectedAt: '2026-11-01T10:00:00.000Z',
};

test('file storage survives reopening, enables WAL and retains untracked catalogue entries', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'transpolyon-storage-'));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	const path = join(directory, 'nested', 'velov.sqlite');
	let database = openDatabase(path);
	try {
		assert.equal(database.prepare('PRAGMA journal_mode').get()?.journal_mode, 'wal');
		assert.equal(database.prepare('PRAGMA busy_timeout').get()?.timeout, 5000);
		assert.equal(database.prepare('PRAGMA foreign_keys').get()?.foreign_keys, 1);
		let store = createStationStore(database);
		assert.deepEqual(store.getTrackedStations(), []);
		const tracked = store.replaceTrackedStations([station.id], [station]);
		database.close();
		database = openDatabase(path);
		store = createStationStore(database);
		assert.deepEqual(store.getTrackedStations(), tracked);
		assert.deepEqual(store.replaceTrackedStations([station.id], [station]), tracked);
		assert.throws(() => store.replaceTrackedStations([999], [station]), /Unknown station/);
		assert.deepEqual(store.getTrackedStations(), tracked);
		assert.deepEqual(store.replaceTrackedStations([], []), []);
		const persisted = database.prepare('SELECT * FROM stations WHERE id = ?').get(station.id);
		assert.equal(persisted?.capacity, null);
		assert.equal(persisted?.status, null);
		assert.equal(persisted?.source_updated_at, null);
		assert.equal(persisted?.source, 'grandlyon-live');
	} finally {
		database.close();
	}
});

test('migration upgrades the previous schema without losing station metadata', () => {
	const database = new DatabaseSync(':memory:');
	try {
		database.exec(migrations[0]);
		database.exec(`PRAGMA user_version = 1;
			INSERT INTO stations VALUES (1001, 'Terreaux', NULL, 45.76, 4.83, NULL, NULL,
			'grandlyon-live', NULL, '2026-11-01T10:00:00.000Z');`);
		migrate(database);
		migrate(database);
		assert.equal(database.prepare('PRAGMA user_version').get()?.user_version, migrations.length);
		assert.equal(
			database.prepare('SELECT name FROM stations WHERE id=1001').get()?.name,
			'Terreaux',
		);
		assert.deepEqual(createStationStore(database).getTrackedStations(), []);
		database.exec(`PRAGMA user_version = ${migrations.length + 1}`);
		assert.throws(() => migrate(database), /Unsupported database schema/);
		assert.equal(database.prepare('SELECT count(*) AS n FROM stations').get()?.n, 1);
	} finally {
		database.close();
	}
});

test('failed replacement rolls back metadata and tracking together', () => {
	const database = openDatabase(':memory:');
	try {
		const store = createStationStore(database);
		const tracked = store.replaceTrackedStations([station.id], [station]);
		assert.throws(() =>
			store.replaceTrackedStations(
				[],
				[
					{ ...station, name: 'Changed' },
					{ ...station, id: 2, capacity: -1 },
				],
			),
		);
		assert.equal(
			database.prepare('SELECT name FROM stations WHERE id=?').get(station.id)?.name,
			station.name,
		);
		assert.deepEqual(store.getTrackedStations(), tracked);
	} finally {
		database.close();
	}
});

test('storage configuration errors never echo their value', () => {
	assert.throws(() => openDatabase(''), /non-empty SQLite/);
	assert.throws(
		() => openDatabase('/dev/null/secret-token.sqlite'),
		(error: Error) => {
			assert.equal(error.message, 'Unable to initialize Vélo’v SQLite storage');
			assert.equal(error.cause, undefined);
			return true;
		},
	);
});
