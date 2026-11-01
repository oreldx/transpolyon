import type { DatabaseSync } from 'node:sqlite';
import type { Station, TrackedStation } from '../velov/contracts.ts';

export function createStationStore(database: DatabaseSync) {
	const upsert = database.prepare(`INSERT INTO stations
		(id, name, address, latitude, longitude, status, capacity, source, source_updated_at, collected_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET name=excluded.name, address=excluded.address,
		latitude=excluded.latitude, longitude=excluded.longitude, status=excluded.status,
		capacity=excluded.capacity, source=excluded.source,
		source_updated_at=excluded.source_updated_at, collected_at=excluded.collected_at`);
	const list = database.prepare(`SELECT station_id AS stationId, tracked_since AS trackedSince
		FROM tracked_stations ORDER BY station_id`);
	const track = database.prepare(`INSERT INTO tracked_stations (station_id, tracked_since)
		VALUES (?, ?) ON CONFLICT(station_id) DO NOTHING`);
	const untrack = database.prepare('DELETE FROM tracked_stations WHERE station_id = ?');

	function getTrackedStations(): TrackedStation[] {
		return list.all() as unknown as TrackedStation[];
	}

	return {
		getTrackedStations,
		/** Validate against the live catalogue before calling; the complete replacement is atomic. */
		replaceTrackedStations(stationIds: number[], catalogue: Station[]): TrackedStation[] {
			const known = new Set(catalogue.map((station) => station.id));
			if (stationIds.some((id) => !known.has(id))) throw new Error('Unknown station identifier');
			const wanted = new Set(stationIds);
			database.exec('BEGIN IMMEDIATE');
			try {
				for (const station of catalogue) {
					upsert.run(
						station.id,
						station.name,
						station.address,
						station.latitude,
						station.longitude,
						station.status,
						station.capacity,
						station.source,
						station.sourceUpdatedAt,
						station.collectedAt,
					);
				}
				for (const station of getTrackedStations()) {
					if (!wanted.has(station.stationId)) untrack.run(station.stationId);
				}
				const now = new Date().toISOString();
				for (const id of stationIds) track.run(id, now);
				const result = getTrackedStations();
				database.exec('COMMIT');
				return result;
			} catch (error) {
				database.exec('ROLLBACK');
				throw error;
			}
		},
	};
}
