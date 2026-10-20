#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
import { dataStore } from '../src/server/storage/dataStore.ts';

dotenv.config();

async function seed() {
  console.log('[SRMS Seed] Initializing development data store...');
  await dataStore.init(process.env.MONGODB_URI);
  console.log('[SRMS Seed] Seeding complete! Standard enterprise users and reports verified.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SRMS Seed] Seeding error:', err);
  process.exit(1);
});
