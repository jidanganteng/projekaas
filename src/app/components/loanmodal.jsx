import { db } from "@/app/lib/db.js";
import { NextResponse } from "next/server";

// GET - Ambil semua data peminjaman
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        l.*,
        u.name as user_name,
        u.email as user_email,
        b.title,
        b.author,
        b.cover_image
      FROM loans l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN books b ON l.book_id = b.id
    `;
    
    const params = [];
    
    if (status) {
      query += ` WHERE l.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [loans] = await db.execute(query, params);

    console.log(`✅ Fetched ${loans.length} loans`);

    return NextResponse.json(loans);

  } catch (error) {
    console.error('GET /api/admin/loans error:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        message: error.message || "Gagal mengambil data peminjaman",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update status peminjaman
export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      loan_id, 
      action, 
      admin_id, 
      reason, 
      admin_notes,
      condition,
      fine_amount 
    } = body;

    // Validasi
    if (!loan_id || !action || !admin_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Loan ID, action, dan admin ID wajib diisi" 
        },
        { status: 400 }
      );
    }

    // Verifikasi admin
    const [adminCheck] = await db.execute(
      `SELECT * FROM users WHERE id = ? AND is_admin = 1`,
      [admin_id]
    );

    if (adminCheck.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Akses ditolak. Hanya admin yang dapat memproses peminjaman" 
        },
        { status: 403 }
      );
    }

    let newStatus;
    let updateQuery = '';
    let updateParams = [];

    switch(action) {
      case 'approve':
        newStatus = 'approved';
        updateQuery = `
          UPDATE loans 
          SET status = ?, approved_at = NOW(), approved_by = ?, admin_notes = ?
          WHERE id = ?
        `;
        updateParams = [newStatus, admin_id, admin_notes || '', loan_id];
        break;

      case 'reject':
        newStatus = 'rejected';
        updateQuery = `
          UPDATE loans 
          SET status = ?, rejected_at = NOW(), rejected_by = ?, reject_reason = ?, admin_notes = ?
          WHERE id = ?
        `;
        updateParams = [newStatus, admin_id, reason, admin_notes || '', loan_id];
        break;

      case 'start_borrow':
        newStatus = 'borrowed';
        updateQuery = `
          UPDATE loans 
          SET status = ?, borrowed_at = NOW(), borrowed_by = ?, admin_notes = ?
          WHERE id = ?
        `;
        updateParams = [newStatus, admin_id, admin_notes || '', loan_id];
        
        // Kurangi stok buku yang tersedia
        await db.execute(`
          UPDATE books 
          SET available_stock = available_stock - 1 
          WHERE id = (SELECT book_id FROM loans WHERE id = ?)
        `, [loan_id]);
        break;

      case 'return':
        newStatus = 'returned';
        updateQuery = `
          UPDATE loans 
          SET status = ?, returned_at = NOW(), returned_by = ?, 
              condition = ?, fine_amount = ?, admin_notes = ?
          WHERE id = ?
        `;
        updateParams = [
          newStatus, admin_id, 
          condition || 'baik', 
          fine_amount || 0, 
          admin_notes || '', 
          loan_id
        ];
        
        // Tambah stok buku yang tersedia
        await db.execute(`
          UPDATE books 
          SET available_stock = available_stock + 1 
          WHERE id = (SELECT book_id FROM loans WHERE id = ?)
        `, [loan_id]);
        break;

      default:
        return NextResponse.json(
          { 
            success: false, 
            message: "Aksi tidak valid" 
          },
          { status: 400 }
        );
    }

    // Update loan status
    await db.execute(updateQuery, updateParams);

    // Log activity
    await db.execute(`
      INSERT INTO admin_logs (admin_id, action, table_name, record_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      admin_id,
      `${action}_loan`,
      'loans',
      loan_id,
      JSON.stringify({
        status: newStatus,
        reason,
        condition,
        fine_amount
      })
    ]);

    console.log(`✅ Loan ${loan_id} updated to ${newStatus}`);

    return NextResponse.json({
      success: true,
      message: `✅ Peminjaman berhasil di${
        action === 'approve' ? 'setujui' : 
        action === 'reject' ? 'tolak' : 
        action === 'start_borrow' ? 'mulai' : 
        'kembalikan'
      }`
    });

  } catch (error) {
    console.error("PUT /api/admin/loans error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        message: error.message || "Gagal memproses peminjaman",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}