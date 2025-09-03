const { execSync } = require('child_process');
const fs = require('fs');

console.log('Building for mobile...');

// Set mobile build environment
process.env.MOBILE_BUILD = 'true';
process.env.NODE_ENV = 'production';

try {
    // Build the Next.js app
    execSync('next build', { stdio: 'inherit' });

    // Create _capacitor directory if it doesn't exist
    if (!fs.existsSync('_capacitor')) {
        fs.mkdirSync('_capacitor');
    }

    console.log('Mobile build completed successfully!');
} catch (error) {
    console.error('Mobile build failed:', error);
    process.exit(1);
}