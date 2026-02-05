// generate-config.js
const fs = require('fs');

const configContent = `
// config.js (auto-generated)
// Firebase/Firestore Configuration (if using Firestore)
window.FIREBASE_CONFIG = {
  apiKey: "${process.env.PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${process.env.PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.PUBLIC_FIREBASE_PROJECT_ID}"
};
`;

fs.writeFileSync('./v2/config.js', configContent.trim(), 'utf8');
console.log('✅ config.js generated in /v2');
