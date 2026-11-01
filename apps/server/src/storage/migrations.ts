import type { DatabaseSync } from 'node:sqlite';

export const migrations = [
	// Append only: an existing entry must never be edited after deployment.
	`CREATE TABLE stations (
		id INTEGER PRIMARY KEY CHECK (id > 0),
		name TEXT NOT NULL,
		address TEXT,
		latitude REAL NOT NULL,
		longitude REAL NOT NULL,
		status TEXT,
		capacity INTEGER CHECK (capacity >= 0),
		source TEXT NOT NULL,
		source_updated_at TEXT,
		collected_at TEXT NOT NULL
	) STRICT;`,
	`CREATE TABLE tracked_stations (
		station_id INTEGER PRIMARY KEY REFERENCES stations(id),
		tracked_since TEXT NOT NULL
	) STRICT;`,
] as const;

export function migrate(database: DatabaseSync): void {
	// Take the writer lock before reading the version, including for concurrent startups.
	database.exec('BEGIN IMMEDIATE');
	try {
		const version = database.prepare('PRAGMA user_version').get()?.user_version as number;
		if (version > migrations.length) throw new Error('Unsupported database schema version');
		for (let index = version; index < migrations.length; index++) {
			database.exec(migrations[index]);
			database.exec(`PRAGMA user_version = ${index + 1}`);
		}
		database.exec('COMMIT');
	} catch (error) {
		database.exec('ROLLBACK');
		throw error;
	}
}
