/** UTC ISO-8601 timestamps; null means the source did not provide a value. */
export type Timestamp = string;
export type Provenance = 'grandlyon-live' | 'grandlyon-history';

export interface Station {
	/** Grand Lyon `number`, never `gid`. */
	id: number;
	name: string;
	address: string | null;
	latitude: number;
	longitude: number;
	status: string | null;
	capacity: number | null;
	source: Provenance;
	sourceUpdatedAt: Timestamp | null;
	collectedAt: Timestamp;
}

export interface TrackedStation {
	stationId: number;
	trackedSince: Timestamp;
}

export interface Observation {
	stationId: number;
	source: Provenance;
	sourceUpdatedAt: Timestamp | null;
	collectedAt: Timestamp;
	quality: 'valid' | 'partial' | 'stale';
	status: string | null;
	capacity: number | null;
	bikes: number | null;
	mechanicalBikes: number | null;
	electricBikes: number | null;
	electricInternalBatteryBikes: number | null;
	electricRemovableBatteryBikes: number | null;
	availableStands: number | null;
}

export interface WeatherForecast {
	source: string;
	latitude: number;
	longitude: number;
	issuedAt: Timestamp | null;
	/** Earliest instant at which this run was available to the application. */
	receivedAt: Timestamp;
	targetAt: Timestamp;
	temperatureCelsius: number | null;
	precipitationMillimeters: number | null;
	windSpeedKmh: number | null;
}

export type ForecastResult = {
	stationId: number;
	metric: 'mechanicalBikes' | 'electricBikes' | 'availableStands';
	targetAt: Timestamp;
	computedAt: Timestamp;
	dataThrough: Timestamp | null;
} & (
	| {
			status: 'available';
			value: number;
			method: 'statistical' | 'enriched';
			modelVersion: string;
			freshness: 'fresh' | 'stale';
	  }
	| {
			status: 'unavailable';
			value: null;
			reason: 'not-tracked' | 'insufficient-data' | 'stale-data' | 'task-failed';
	  }
);

export interface ModelVersion {
	id: string;
	method: 'statistical' | 'enriched';
	createdAt: Timestamp;
	trainingFrom: Timestamp;
	trainingThrough: Timestamp;
	artifactPath: string | null;
	status: 'candidate' | 'active' | 'retired' | 'rejected';
}

export interface TaskState {
	name: string;
	status: 'idle' | 'running' | 'succeeded' | 'failed';
	startedAt: Timestamp | null;
	finishedAt: Timestamp | null;
	lastSucceededAt: Timestamp | null;
	/** Public code only: provider credentials and raw exceptions never belong here. */
	errorCode: string | null;
}
