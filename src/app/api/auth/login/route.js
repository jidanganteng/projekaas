import { db } from '@/app/lib/db.js';          
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return new Response(JSON.stringify({ message: 'Email atau password salah' }), { status: 401 });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return new Response(JSON.stringify({ message: 'Email atau password salah' }), { status: 401 });
    }

    // Jangan kirim password
    delete user.password;

    return new Response(JSON.stringify({ message: 'Login berhasil', user }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan server' }), { status: 500 });
  }
}