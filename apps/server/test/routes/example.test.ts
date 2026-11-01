import { test } from 'node:test';
import * as assert from 'node:assert';
import { build } from '../helper.js';

test('tracking configuration is initially empty', async (t) => {
	const app = await build(t);

	const res = await app.inject({
		url: '/velov/tracked-stations',
	});

	assert.equal(res.statusCode, 200);
	assert.deepStrictEqual(res.json(), { stations: [] });
});
