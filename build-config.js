// Bu script, Vercel Environment Variables'dan config.js dosyası oluşturur
// CommonJS syntax kullanıyoruz
const fs = require('fs');
const path = require('path');

// Config içeriğini oluştur
const content = `const config = {
  apiUrl: 'https://e-commerce-backend-5kxu.onrender.com',
  firebase: {
    apiKey: "${process.env.FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.FIREBASE_APP_ID || ''}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID || ''}"
  }
};

export default config;`;

// Config.js dosyasını oluştur
const configPath = path.join(__dirname, 'assets', 'js', 'config.js');

// Js dizini olup olmadığını kontrol et
const jsDir = path.join(__dirname, 'assets', 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

fs.writeFileSync(configPath, content);

console.log('Config.js dosyası başarıyla oluşturuldu!'); 