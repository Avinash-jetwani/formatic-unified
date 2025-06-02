#!/usr/bin/env node

/**
 * Deployment Validation Script
 * This script validates that your Formatic app is properly configured for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Formatic Deployment Configuration...\n');

const errors = [];
const warnings = [];
const checks = [];

// Check 1: GitHub Actions workflow exists
function checkGitHubWorkflow() {
  const workflowPath = '.github/workflows/deploy.yml';
  if (fs.existsSync(workflowPath)) {
    checks.push('✅ GitHub Actions workflow found');
    
    const content = fs.readFileSync(workflowPath, 'utf8');
    if (content.includes('secrets.SERVER_IP')) {
      checks.push('✅ Workflow configured for SERVER_IP secret');
    } else {
      errors.push('❌ Workflow missing SERVER_IP secret configuration');
    }
    
    if (content.includes('reset-user-passwords.js')) {
      checks.push('✅ Password reset script integrated in workflow');
    } else {
      warnings.push('⚠️  Password reset script not found in workflow');
    }
  } else {
    errors.push('❌ GitHub Actions workflow not found');
  }
}

// Check 2: Password reset script exists
function checkPasswordResetScript() {
  const scriptPath = 'backend/scripts/reset-user-passwords.js';
  if (fs.existsSync(scriptPath)) {
    checks.push('✅ Password reset script found');
    
    const content = fs.readFileSync(scriptPath, 'utf8');
    if (content.includes('admin@formatic.com') && content.includes('john@doe.com')) {
      checks.push('✅ Password reset script configured for required users');
    } else {
      warnings.push('⚠️  Password reset script may not include all required users');
    }
  } else {
    errors.push('❌ Password reset script not found at backend/scripts/reset-user-passwords.js');
  }
}

// Check 3: Backend main.ts configuration
function checkBackendConfig() {
  const mainPath = 'backend/src/main.ts';
  if (fs.existsSync(mainPath)) {
    checks.push('✅ Backend main.ts found');
    
    const content = fs.readFileSync(mainPath, 'utf8');
    if (content.includes('setGlobalPrefix(\'api\')')) {
      checks.push('✅ Backend API prefix configured');
    } else {
      warnings.push('⚠️  Backend API prefix may not be configured');
    }
    
    if (content.includes('corsOrigins')) {
      checks.push('✅ CORS configuration updated for production');
    } else {
      warnings.push('⚠️  CORS configuration may need updating');
    }
  } else {
    errors.push('❌ Backend main.ts not found');
  }
}

// Check 4: Frontend configuration
function checkFrontendConfig() {
  const nextConfigPath = 'frontend/next.config.js';
  if (fs.existsSync(nextConfigPath)) {
    checks.push('✅ Frontend Next.js config found');
    
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    if (content.includes('NEXT_PUBLIC_API_URL')) {
      checks.push('✅ Frontend API URL configuration found');
    } else {
      warnings.push('⚠️  Frontend API URL configuration may be missing');
    }
  } else {
    errors.push('❌ Frontend Next.js config not found');
  }
}

// Check 5: PM2 ecosystem configuration
function checkPM2Config() {
  const ecosystemPath = 'ecosystem.config.js';
  if (fs.existsSync(ecosystemPath)) {
    checks.push('✅ PM2 ecosystem config found');
    
    const content = fs.readFileSync(ecosystemPath, 'utf8');
    if (content.includes('frontend') && content.includes('backend')) {
      checks.push('✅ PM2 configured for both frontend and backend');
    } else {
      warnings.push('⚠️  PM2 ecosystem may not include both services');
    }
  } else {
    warnings.push('⚠️  PM2 ecosystem config not found (optional)');
  }
}

// Check 6: Package.json files
function checkPackageJsonFiles() {
  const backendPkg = 'backend/package.json';
  const frontendPkg = 'frontend/package.json';
  
  if (fs.existsSync(backendPkg)) {
    checks.push('✅ Backend package.json found');
  } else {
    errors.push('❌ Backend package.json not found');
  }
  
  if (fs.existsSync(frontendPkg)) {
    checks.push('✅ Frontend package.json found');
  } else {
    errors.push('❌ Frontend package.json not found');
  }
}

// Check 7: Prisma schema
function checkPrismaSchema() {
  const schemaPath = 'backend/prisma/schema.prisma';
  if (fs.existsSync(schemaPath)) {
    checks.push('✅ Prisma schema found');
  } else {
    errors.push('❌ Prisma schema not found');
  }
}

// Run all checks
checkGitHubWorkflow();
checkPasswordResetScript();
checkBackendConfig();
checkFrontendConfig();
checkPM2Config();
checkPackageJsonFiles();
checkPrismaSchema();

// Display results
console.log('📊 VALIDATION RESULTS\n');

if (checks.length > 0) {
  console.log('✅ PASSED CHECKS:');
  checks.forEach(check => console.log(`   ${check}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERRORS (MUST FIX):');
  errors.forEach(error => console.log(`   ${error}`));
  console.log('');
}

// Final assessment
if (errors.length === 0) {
  console.log('🎉 DEPLOYMENT READY!');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Set GitHub secrets (SERVER_IP, SSH_PRIVATE_KEY)');
  console.log('2. Optionally set domain secrets (DOMAIN, API_URL, FRONTEND_URL)');
  console.log('3. Commit and push to main branch');
  console.log('4. Monitor deployment in GitHub Actions');
  console.log('');
  console.log('🔑 LOGIN CREDENTIALS AFTER DEPLOYMENT:');
  console.log('   admin@formatic.com : NewAdmin2024!');
  console.log('   john@doe.com : JohnDoe2024!');
} else {
  console.log('🚫 DEPLOYMENT NOT READY');
  console.log('Please fix the errors listed above before deploying.');
  process.exit(1);
}

console.log('\n🔗 For detailed instructions, see: deploy-instructions.md'); 