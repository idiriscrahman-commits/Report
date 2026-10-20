#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { dataStore } from '../src/server/storage/dataStore.ts';

dotenv.config();

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@srms.org';
  const password = args[1] || 'AdminPass123!';
  const name = args[2] || 'System Administrator';

  console.log(`[SRMS Admin CLI] Connecting to data store...`);
  await dataStore.init(process.env.MONGODB_URI);

  const existing = await dataStore.findUserByEmail(email);
  if (existing) {
    console.error(`[SRMS Admin CLI] Error: A user with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await dataStore.createUser({
    name,
    email,
    passwordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
    profile: {
      department: 'Executive Administration',
      title: 'Root System Administrator',
      phone: '',
      bio: 'Initialized via create-admin CLI script.',
    },
  });

  console.log(`[SRMS Admin CLI] Administrator created successfully:`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Role: ${user.role}`);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('[SRMS Admin CLI] Fatal error:', err);
  process.exit(1);
});
