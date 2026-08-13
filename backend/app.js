#!/usr/bin/env node

/**
 * PF-QMS Backend Entry Point for cPanel/Passenger
 * Loads the compiled Express app with Socket.IO support
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { initializePrisma } = require('./prisma-init');

// Check if dist/index.js exists
const distPath = path.join(__dirname, 'dist', 'index.js');

if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist/index.js not found!');
  console.error('Please run: npm run build');
  process.exit(1);
}

console.log('[Passenger] Loading PF-QMS backend...');

// Auto-initialize Prisma if needed (async wrapper)
(async () => {
  try {
    await initializePrisma();
    console.log('[Passenger] Prisma initialized, loading app...');
  } catch (error) {
    console.error('[Passenger] Warning: Prisma initialization failed:', error.message);
    console.error('[Passenger] App will attempt to start anyway...');
  }
})();

// For Passenger, we export the Express app
// Passenger will handle wrapping it with an HTTP server
module.exports = require('./dist/index.js');

