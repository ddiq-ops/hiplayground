/**
 * PNG to WebP Converter
 * Converts all PNG files in assets/games/weapon-levelup/images to WebP format
 * - Quality: 80
 * - Transparency: Preserved
 * - Original PNG files: Kept
 * - WebP files: Saved to /webp subfolder
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.error('Error: sharp module not found.');
  console.error('Please install it by running: npm install sharp');
  process.exit(1);
}

const sourceDir = path.join(__dirname, 'assets', 'games', 'weapon-levelup', 'images');
const webpDir = path.join(sourceDir, 'webp');

// Create webp directory if it doesn't exist
if (!fs.existsSync(webpDir)) {
  fs.mkdirSync(webpDir, { recursive: true });
  console.log(`Created directory: ${webpDir}`);
}

// Get all PNG files
const files = fs.readdirSync(sourceDir).filter(file => 
  file.toLowerCase().endsWith('.png')
);

if (files.length === 0) {
  console.log('No PNG files found in the source directory.');
  process.exit(0);
}

console.log(`Found ${files.length} PNG file(s) to convert.\n`);

let successCount = 0;
let errorCount = 0;

// Convert each PNG file
async function convertFiles() {
  for (const file of files) {
    const inputPath = path.join(sourceDir, file);
    const outputFileName = file.replace(/\.png$/i, '.webp');
    const outputPath = path.join(webpDir, outputFileName);
    
    try {
      await sharp(inputPath)
        .webp({ 
          quality: 80,
          effort: 6 // 0-6, higher = better compression but slower
        })
        .toFile(outputPath);
      
      const inputStats = fs.statSync(inputPath);
      const outputStats = fs.statSync(outputPath);
      const sizeReduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
      
      console.log(`✓ ${file} → ${outputFileName} (${sizeReduction}% smaller)`);
      successCount++;
    } catch (error) {
      console.error(`✗ Error converting ${file}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\nConversion complete!`);
  console.log(`Success: ${successCount} file(s)`);
  if (errorCount > 0) {
    console.log(`Errors: ${errorCount} file(s)`);
  }
}

convertFiles().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

