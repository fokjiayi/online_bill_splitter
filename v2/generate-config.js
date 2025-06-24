// generate-config.js
const fs = require('fs');

const configContent = `
// config.js (auto-generated)
window.SUPABASE_CONFIG = {
  url: "${process.env.SUPABASE_URL}",
  key: "${process.env.SUPABASE_KEY}"
};
`;

fs.writeFileSync('./public/config.js', configContent.trim(), 'utf8');
console.log('✅ config.js generated.');
