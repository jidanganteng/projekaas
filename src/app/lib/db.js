import mysql from "mysql2/promise";

export const db = mysql.createPool({
  port: 3307,
  host: "localhost",
  user: "root",
  password: "", 
  database: "perpustakaan",
});

console.log("Database connected", db ? "✅" : "❌");

// Test koneksi
db.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });
