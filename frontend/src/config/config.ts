// Environment-based configuration
const isDevelopment = import.meta.env.DEV; // Vite way
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.startsWith('192.168.') ||
                   window.location.hostname.startsWith('10.') ||
                   window.location.hostname.startsWith('172.');

const config = {
  apiUrl: isDevelopment && isLocalhost 
    ? 'http://localhost:5000'
    : 'https://arc-backend-fyahengy.g2frdjbb.centralindia-01.azurewebsites.net',
  socketUrl: isDevelopment && isLocalhost 
    ? 'http://localhost:5000'
    : 'https://arc-backend-fyahengy.g2frdjbb.centralindia-01.azurewebsites.net',
  frontendUrl: isDevelopment && isLocalhost 
    ? 'http://localhost:3000'
    : 'https://arc.squadhunt.com'
};

// Debug logging
console.log('Config Debug:', {
  hostname: window.location.hostname,
  isDevelopment,
  isLocalhost,
  apiUrl: config.apiUrl,
  socketUrl: config.socketUrl
});

export default config;
