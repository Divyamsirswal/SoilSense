const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const process = require('process');

// Determine if we're on Windows
const isWindows = os.platform() === 'win32';

// Define the commands for each service
const services = [
  {
    name: 'ML API Server',
    command: isWindows ? 'cmd' : 'bash',
    args: isWindows
      ? ['/c', 'cd ML && set SKIP_MLFLOW=true && uvicorn api.main:app --host 0.0.0.0 --port 8000']
      : ['-c', 'cd ML && SKIP_MLFLOW=true uvicorn api.main:app --host 0.0.0.0 --port 8000'],
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Next.js App',
    command: isWindows ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    color: '\x1b[32m' // Green
  }
];

// Store all the processes
const processes = [];

// Function to start a service
function startService(service) {
  console.log(`${service.color}[${service.name}] Starting...${'\x1b[0m'}`);

  const proc = spawn(service.command, service.args, {
    shell: true,
    stdio: 'pipe',
    env: Object.assign({}, process.env, { FORCE_COLOR: '1' })
  });

  processes.push(proc);

  proc.stdout.on('data', (data) => {
    console.log(`${service.color}[${service.name}] ${data.toString().trim()}${'\x1b[0m'}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`${service.color}[${service.name}] ${data.toString().trim()}${'\x1b[0m'}`);
  });

  proc.on('close', (code) => {
    console.log(`${service.color}[${service.name}] Process exited with code ${code}${'\x1b[0m'}`);
  });

  return proc;
}

// Start all services
services.forEach(startService);

// Handle cleanup
function cleanup() {
  console.log('\nShutting down all services...');
  processes.forEach(proc => {
    try {
      isWindows ? proc.kill() : proc.kill('SIGINT');
    } catch (e) {
      console.error('Failed to kill process:', e);
    }
  });
}

// Handle termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

console.log('\x1b[33m%s\x1b[0m', '🌱 SoilGuardian services started. Press Ctrl+C to stop all services.'); 