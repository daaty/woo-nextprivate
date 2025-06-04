/* 
This is a script to install required dependencies.
Run using: node install-dependencies.js 
*/

const { execSync } = require('child_process');

console.log('Installing required dependencies...');

try {
  // Install react-toastify if not already installed
  execSync('npm install react-toastify --save', { stdio: 'inherit' });
  
  console.log('Dependencies installed successfully!');
  console.log('Run "npm run dev" to start your application');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}
