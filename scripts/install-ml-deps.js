const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine if we're on Windows
const isWindows = os.platform() === 'win32';

// Path to ML directory
const mlDir = path.join(__dirname, '..', 'ML');

// Check if ML directory exists
if (!fs.existsSync(mlDir)) {
    console.error('ML directory not found. Please ensure the ML directory exists.');
    process.exit(1);
}

console.log('\x1b[33m%s\x1b[0m', '🌱 Installing ML dependencies...');

// Determine the Python command to use
const pythonCommand = isWindows ? 'python' : 'python3';

// Check if Python is installed
const checkPython = spawn(pythonCommand, ['--version']);

checkPython.on('error', (err) => {
    console.error('\x1b[31m%s\x1b[0m', `❌ Error: Python not found. Please install ${pythonCommand} and try again.`);
    process.exit(1);
});

checkPython.on('close', (code) => {
    if (code !== 0) {
        console.error('\x1b[31m%s\x1b[0m', `❌ Error: Python check failed with code ${code}.`);
        process.exit(1);
    }

    // Install dependencies
    console.log('\x1b[36m%s\x1b[0m', `📦 Installing dependencies using ${pythonCommand} -m pip...`);

    const pipInstall = spawn(
        pythonCommand,
        ['-m', 'pip', 'install', '-r', 'requirements.txt'],
        { cwd: mlDir, stdio: 'inherit' }
    );

    pipInstall.on('error', (err) => {
        console.error('\x1b[31m%s\x1b[0m', '❌ Failed to install ML dependencies:', err);
        process.exit(1);
    });

    pipInstall.on('close', (code) => {
        if (code !== 0) {
            console.error('\x1b[31m%s\x1b[0m', `❌ pip install exited with code ${code}`);
            process.exit(1);
        }

        console.log('\x1b[32m%s\x1b[0m', '✅ ML dependencies installed successfully!');

        // Create required directories if they don't exist
        const dirs = ['models/saved', 'logs', 'data'];

        for (const dir of dirs) {
            const dirPath = path.join(mlDir, dir);
            if (!fs.existsSync(dirPath)) {
                console.log(`Creating directory: ${dir}`);
                fs.mkdirSync(dirPath, { recursive: true });
            }
        }

        console.log('\x1b[32m%s\x1b[0m', '✅ ML setup complete!');
        console.log('\x1b[33m%s\x1b[0m', '🚀 You can now run:');
        console.log('\x1b[33m%s\x1b[0m', '   npm run start-services');
        console.log('\x1b[33m%s\x1b[0m', '   to start both the Next.js app and ML API server together.');
    });
}); 