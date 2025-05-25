const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of files that import authOptions from the old path
const fileList = [
    'app/api/soil-data/[id]/route.ts',
    'app/api/weather-data/route.ts',
    'app/api/soil-data/route.ts',
    'app/api/soil-data/recent/route.ts',
    'app/api/recommendations/route.ts',
    'app/api/ml-recommendation/route.ts',
    'app/api/farms/route.ts',
    'app/api/farms/[id]/crops/route.ts',
    'app/api/devices/[id]/route.ts',
    'app/api/farms/[id]/route.ts',
    'app/api/farms/[id]/zones/route.ts',
    'app/api/devices/route.ts',
    'app/api/farms/[id]/soil-data/route.ts',
    'app/api/farms/[id]/devices/route.ts',
    'app/api/devices/connect/route.ts',
    'app/api/analytics/route.ts',
    'app/(dashboard)/dashboard/page.tsx',
];

console.log('Updating authOptions imports in project files...');

// Update each file
let updatedCount = 0;
fileList.forEach(filePath => {
    try {
        const fullPath = path.join(process.cwd(), filePath);

        // Skip if file doesn't exist
        if (!fs.existsSync(fullPath)) {
            console.log(`Skipping ${filePath} - file doesn't exist`);
            return;
        }

        // Read file content
        let content = fs.readFileSync(fullPath, 'utf8');

        // Replace the import path
        const oldImport = /import\s+{(?:\s+)?authOptions(?:\s+)?}\s+from\s+["']@\/app\/api\/auth\/\[\.\.\.nextauth\]\/route["'];?/;
        const newImport = `import { authOptions } from "@/app/api/auth/auth-options";`;

        // Check if file contains the import we need to replace
        if (oldImport.test(content)) {
            content = content.replace(oldImport, newImport);
            fs.writeFileSync(fullPath, content);
            console.log(`✅ Updated ${filePath}`);
            updatedCount++;
        } else {
            console.log(`⏩ No changes needed in ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
});

console.log(`Finished updating ${updatedCount} files.`);
console.log('Now try building the project again with: npm run build'); 