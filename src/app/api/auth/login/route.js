// app/api/auth/login/route.js
import { db } from '@/app//lib/db'; // atau sesuaikan path db Anda
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Tambahkan ini untuk CORS (jika diperlukan)
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    console.log('🔍 Login attempt:', { email }); // Debug log

    // Validasi input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: 'Email dan password harus diisi' }), 
        { status: 400 }
      );
    }

    // Cek user di database
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE LIMIT 1',
      [email]
    );

    console.log('📊 Query result:', rows.length > 0 ? 'User found' : 'User not found'); // Debug log

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Email atau password salah' }), 
        { status: 401 }
      );
    }

    const user = rows[0];
    console.log('👤 User data:', { id: user.id, email: user.email, role: user.role }); // Debug log

    // Cek password dengan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('🔐 Password validation:', isPasswordValid ? 'Valid' : 'Invalid'); // Debug log

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ message: 'Email atau password salah' }), 
        { status: 401 }
      );
    }

    // Buat JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this', // Fallback secret
      { expiresIn: '7d' }
    );

    // Hapus password dari response
    delete user.password;

    // Set cookie HttpOnly
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
    );

    console.log('✅ Login successful for:', user.email); // Debug log

    return new Response(
      JSON.stringify({ 
        message: 'Login berhasil', 
        user,
        token // Kirim token juga untuk debugging
      }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error('❌ Login error:', err);
    return new Response(
      JSON.stringify({ 
        message: 'Terjadi kesalahan server',
        error: err.message 
      }), 
      { status: 500 }
    );
  }
}