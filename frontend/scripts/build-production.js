#!/usr/bin/env node
/**
 * Production Build Script for SikaRemit Frontend
 * Validates environment, builds, and prepares for deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
];

// Optional but recommended
const RECOMMENDED_ENV_VARS = [
  'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  'GOOGLE_CLIENT_ID',
];

function validateEnvironment() {
  log('\n=== Validating Environment ===\n');
  
  let hasErrors = false;
  
  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      error(`Missing required: ${envVar}`);
      hasErrors = true;
    } else {
      success(`Found: ${envVar}`);
    }
  }
  
  // Check recommended variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      warning(`Missing recommended: ${envVar}`);
    } else {
      success(`Found: ${envVar}`);
    }
  }
  
  // Validate API URL format
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && !apiUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
    warning('API URL should use HTTPS in production');
  }
  
  return !hasErrors;
}

function checkDependencies() {
  log('\n=== Checking Dependencies ===\n');
  
  // Check if node_modules exists
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    info('Installing dependencies...');
    execSync('npm ci', { stdio: 'inherit' });
  }
  
  success('Dependencies ready');
}

function runTypeCheck() {
  log('\n=== Running Type Check ===\n');
  
  try {
    execSync('npm run type-check', { stdio: 'inherit' });
    success('Type check passed');
    return true;
  } catch (e) {
    error('Type check failed');
    return false;
  }
}

function runLint() {
  log('\n=== Running Linter ===\n');
  
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    success('Lint passed');
    return true;
  } catch (e) {
    warning('Lint has warnings (continuing build)');
    return true; // Don't fail on lint warnings
  }
}

function runTests() {
  log('\n=== Running Tests ===\n');
  
  try {
    execSync('npm run test -- --passWithNoTests', { stdio: 'inherit' });
    success('Tests passed');
    return true;
  } catch (e) {
    error('Tests failed');
    return false;
  }
}

function buildApp() {
  log('\n=== Building Application ===\n');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    success('Build completed');
    return true;
  } catch (e) {
    error('Build failed');
    return false;
  }
}

function generateBuildInfo() {
  log('\n=== Generating Build Info ===\n');
  
  const buildInfo = {
    version: require('../package.json').version,
    buildTime: new Date().toISOString(),
    gitCommit: getGitCommit(),
    gitBranch: getGitBranch(),
    nodeVersion: process.version,
  };
  
  const buildInfoPath = path.join(process.cwd(), '.next', 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  info(`Build version: ${buildInfo.version}`);
  info(`Git commit: ${buildInfo.gitCommit}`);
  info(`Build time: ${buildInfo.buildTime}`);
  
  success('Build info generated');
}

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    return 'unknown';
  }
}

function printSummary(success) {
  log('\n========================================');
  if (success) {
    log('  BUILD SUCCESSFUL', 'green');
    log('========================================\n');
    info('Next steps:');
    info('1. Deploy the .next/standalone folder');
    info('2. Copy .next/static to .next/standalone/.next/static');
    info('3. Copy public folder to .next/standalone/public');
    info('4. Run: node .next/standalone/server.js');
  } else {
    log('  BUILD FAILED', 'red');
    log('========================================\n');
    info('Please fix the errors above and try again.');
  }
}

// Main execution
async function main() {
  log('\n========================================');
  log('  SikaRemit Production Build');
  log('========================================');
  
  const skipTests = process.argv.includes('--skip-tests');
  const skipLint = process.argv.includes('--skip-lint');
  
  // Step 1: Validate environment
  if (!validateEnvironment()) {
    error('\nEnvironment validation failed. Set required variables and try again.');
    process.exit(1);
  }
  
  // Step 2: Check dependencies
  checkDependencies();
  
  // Step 3: Type check
  if (!runTypeCheck()) {
    printSummary(false);
    process.exit(1);
  }
  
  // Step 4: Lint (optional)
  if (!skipLint) {
    runLint();
  }
  
  // Step 5: Tests (optional)
  if (!skipTests) {
    if (!runTests()) {
      printSummary(false);
      process.exit(1);
    }
  }
  
  // Step 6: Build
  if (!buildApp()) {
    printSummary(false);
    process.exit(1);
  }
  
  // Step 7: Generate build info
  generateBuildInfo();
  
  printSummary(true);
}

main().catch((e) => {
  error(`Unexpected error: ${e.message}`);
  process.exit(1);
});
