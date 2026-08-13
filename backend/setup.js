#!/usr/bin/env node

/**
 * Setup script for cPanel deployment
 * Generates Prisma client and creates database schema
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Setting up PF-QMS Backend...');

try {
  // Change to app directory
  process.chdir(__dirname);
  
  console.log('📂 Current directory:', process.cwd());
  
  // Step 1: Generate Prisma client
  console.log('⚡ Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
  
  // Step 2: Push database schema
  console.log('🗄️  Creating database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Database schema created');
  
  // Step 3: Seed database (optional)
  try {
    console.log('🌱 Seeding database...');
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('✅ Database seeded');
  } catch (seedError) {
    console.log('⚠️  Seeding failed (this is OK if database already has data)');
  }
  
  console.log('🎉 Setup complete! Restart your Node.js app in cPanel.');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}