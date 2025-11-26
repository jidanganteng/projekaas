import { db } from '@/app/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // Cek email sudah ada?
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return new Response(JSON.stringify({ message: 'Email sudah terdaftar' }), { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")',
      [name, email, hashed]
    );

    const [newUser] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [result.insertId]);

    return new Response(JSON.stringify({ message: 'Registrasi berhasil', user: newUser[0] }), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan server' }), { status: 500 });
  }
}