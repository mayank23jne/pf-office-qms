/**
 * Auto-initialize Prisma on cPanel startup
 * This runs automatically when the app starts if Prisma client is not found
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function initializePrisma() {
  const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
  const setupFlagPath = path.join(__dirname, '.prisma-initialized');
  
  // Check if Prisma client exists
  const clientExists = fs.existsSync(prismaClientPath);
  const setupComplete = fs.existsSync(setupFlagPath);
  
  if (clientExists && setupComplete) {
    console.log('✅ Prisma client already initialized');
    return true;
  }
  
  console.log('🔧 Prisma client not found. Auto-initializing...');
  
  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Prisma client generated');
    
    // Push database schema
    console.log('🗄️  Creating database schema...');
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Database schema created');
    
    // Create flag file
    fs.writeFileSync(setupFlagPath, JSON.stringify({
      initializedAt: new Date().toISOString(),
      version: '1.0.0'
    }));
    
    console.log('🎉 Prisma initialization complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Prisma initialization failed:', error.message);
    console.error('Please run setup.js manually or contact hosting support');
    return false;
  }
}

module.exports = { initializePrisma };
