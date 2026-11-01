import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { migrate } from './migrations.ts';

export function openDatabase(path: string): DatabaseSync {
	if (typeof path !== 'string' || !path.trim()) {
		throw new Error('VELOV_DATABASE_PATH must be a non-empty SQLite file path');
	}
	let database: DatabaseSync | undefined;
	try {
		if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
		database = new DatabaseSync(path);
		database.exec(
			'PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;',
		);
		migrate(database);
		return database;
	} catch {
		database?.close();
		// Configuration may contain credentials; do not include the path or raw exception.
		throw new Error('Unable to initialize Vélo’v SQLite storage');
	}
}
