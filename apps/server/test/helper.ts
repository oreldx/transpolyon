// This file contains code that we reuse between our tests.
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import appPlugin from '../src/app.ts';
import * as test from 'node:test';

export type TestContext = {
	after: typeof test.after;
};

// Fill in this config with all the configurations
// needed for testing the application
function config() {
	return {
		skipOverride: true, // Register our application with fastify-plugin
		databasePath: ':memory:',
	};
}

// Automatically build and tear down our instance
async function build(t: TestContext) {
	const app = Fastify();
	await app.register(fp(appPlugin), config());
	await app.ready();

	// Tear down our app after we are done
	t.after(() => void app.close());

	return app;
}

export { config, build };
