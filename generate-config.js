// generate-config.js
const fs = require('fs');

const configContent = `
// config.js (auto-generated)
window.SUPABASE_CONFIG = {
  url: "${process.env.PUBLIC_SUPABASE_URL}",
  key: "${process.env.PUBLIC_SUPABASE_KEY}"
};
`;

fs.writeFileSync('./v2/config.js', configContent.trim(), 'utf8');
console.log('✅ config.js generated in /v2');
