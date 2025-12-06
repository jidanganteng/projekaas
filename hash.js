// test-password.js
// Jalankan: node test-password.js

const bcrypt = require('bcryptjs');

// Hash yang ada di database
const hashFromDB = '$2b$10$mCqzZejCflWLY6LZ7PhUous3CCAurzk79.T59lkPjYAu/VVHo1.Qa';

// Password yang mau di-test
const passwords = ['user123', 'admin123', '123456', 'password'];

console.log('🔍 Testing Password Hash...\n');
console.log('Hash dari database:');
console.log(hashFromDB);
console.log('\n' + '='.repeat(70) + '\n');

// Test setiap password
passwords.forEach(async (password) => {
  const isMatch = await bcrypt.compare(password, hashFromDB);
  console.log(`Password: "${password}" → ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
});

// Generate hash baru untuk password 'user123'
console.log('\n' + '='.repeat(70));
console.log('\n🔧 Generating NEW hash for "user123":\n');

bcrypt.hash('user123', 10, function(err, hash) {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('New Hash:');
  console.log(hash);
  console.log('\n📝 SQL Update Query:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'user@gmail.com';`);
});

// Generate hash untuk admin123
setTimeout(() => {
  bcrypt.hash('admin123', 10, function(err, hash) {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log('\n🔧 NEW hash for "admin123":');
    console.log(hash);
    console.log('\n📝 SQL Update Query:');
    console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@perpustakaan.com';`);
  });
}, 1000);