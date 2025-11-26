import mysql from "mysql2/promise";

export const db = mysql.createPool({
  port: 3307,
  host: "localhost",
  user: "root",
  password: "", 
  database: "perpustakaan",
});

console.log("Database connected", db ? "✅" : "❌");
