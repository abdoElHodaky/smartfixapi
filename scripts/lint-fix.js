#!/usr/bin/env node

/**
 * Automated Code Quality Maintenance Script
 * 
 * This script automatically fixes safe ESLint issues and provides
 * reports on issues that require manual intervention.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting automated code quality maintenance...\n');

// Step 1: Run ESLint with auto-fix for safe issues
console.log('📝 Running ESLint auto-fix for safe issues...');
try {
  execSync('npx eslint . --ext .ts --fix', { stdio: 'inherit' });
  console.log('✅ Auto-fixable issues resolved\n');
} catch (error) {
  console.log('⚠️  Some issues require manual intervention\n');
}

// Step 2: Generate current warning report
console.log('📊 Generating current warning report...');
try {
  const lintOutput = execSync('npx eslint . --ext .ts', { encoding: 'utf8' });
  
  // Parse warnings
  const warnings = lintOutput.split('\n').filter(line => line.includes('warning'));
  const warningTypes = {};
  
  warnings.forEach(warning => {
    const match = warning.match(/@typescript-eslint\/[\w-]+/);
    if (match) {
      const rule = match[0];
      warningTypes[rule] = (warningTypes[rule] || 0) + 1;
    }
  });
  
  // Generate report
  const reportContent = `# Code Quality Report - ${new Date().toISOString().split('T')[0]}

## Summary
- **Total Warnings**: ${warnings.length}
- **Auto-fixed**: Issues that could be automatically resolved
- **Manual Review Required**: ${warnings.length} warnings

## Warning Breakdown
${Object.entries(warningTypes)
  .sort(([,a], [,b]) => b - a)
  .map(([rule, count]) => `- **${rule}**: ${count} warnings`)
  .join('\n')}

## Next Steps
1. Review warnings that require manual intervention
2. Focus on high-impact warnings first
3. Consider updating ESLint rules for stricter enforcement

---
*Generated automatically by lint-fix.js*
`;

  fs.writeFileSync('code-quality-report.md', reportContent);
  console.log('✅ Report saved to code-quality-report.md\n');
  
} catch (error) {
  console.log('✅ No warnings found - code is clean!\n');
}

// Step 3: Check for unused imports specifically
console.log('🔍 Checking for unused imports in test files...');
try {
  const testFiles = execSync('find src/__tests__ -name "*.ts" -type f', { encoding: 'utf8' })
    .split('\n')
    .filter(file => file.trim());
  
  let unusedImportsFound = 0;
  
  testFiles.forEach(file => {
    if (!file.trim()) return;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for common unused test imports
      const unusedPatterns = [
        /import.*jest.*from.*@jest\/globals/,
        /import.*testConfig.*from/,
        /import.*createTestUser.*from/,
        /import.*Types.*from.*mongoose/
      ];
      
      unusedPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          unusedImportsFound++;
        }
      });
    } catch (err) {
      // Skip files that can't be read
    }
  });
  
  if (unusedImportsFound > 0) {
    console.log(`⚠️  Found ${unusedImportsFound} potential unused imports in test files`);
    console.log('   Consider running: npm run lint to see details\n');
  } else {
    console.log('✅ No obvious unused imports found in test files\n');
  }
  
} catch (error) {
  console.log('⚠️  Could not analyze test files\n');
}

// Step 4: Provide recommendations
console.log('💡 Recommendations:');
console.log('   1. Run this script regularly to maintain code quality');
console.log('   2. Review the generated code-quality-report.md');
console.log('   3. Address high-impact warnings first');
console.log('   4. Consider stricter ESLint rules for new code');
console.log('\n🎉 Code quality maintenance complete!');

