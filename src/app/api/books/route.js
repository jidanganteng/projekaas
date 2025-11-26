// app/api/books/route.js
import { db } from "@/app/lib/db.js";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Folder upload
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper: Parsing multipart/form-data untuk POST/PUT
async function parseFormData(req) {
  try {
    const formData = await req.formData();
    const fields = {};
    const files = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files[key] = value;
      } else {
        fields[key] = value;
      }
    }
    return { fields, files };
  } catch (error) {
    console.error("Error parsing form data:", error);
    throw new Error("Gagal memproses data form");
  }
}

// Simpan file upload
async function saveFile(file) {
  if (!file || file.size === 0) return null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    if (!validExtensions.includes(ext)) {
      throw new Error("Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP");
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await fs.promises.writeFile(filepath, buffer);
    return filename;
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error("Gagal menyimpan file cover");
  }
}

// ==================================================
// GET — Ambil semua buku dengan filter dan pagination
// ==================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // ✅ PERBAIKAN: Parsing parameter dengan default value
    const status = searchParams.get("status") || 'all';
    const category = searchParams.get("category") || null;
    const search = searchParams.get("search") || null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 100); // Max 100
    const offset = (page - 1) * limit;

    // ✅ PERBAIKAN: Query builder yang lebih bersih
    let query = `
      SELECT 
        b.*, 
        c.name as category_name,
        u.name as user_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN users u ON b.user_id = u.id
    `;
    
    const params = [];
    const conditions = [];

    // Filter status
    if (status && status !== 'all') {
      conditions.push('b.status = ?');
      params.push(status);
    }

    // Filter kategori
    if (category) {
      conditions.push('b.category_id = ?');
      params.push(category);
    }

    // Filter pencarian
    if (search) {
      conditions.push('(b.title LIKE ? OR b.author LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // ✅ Tambahkan WHERE jika ada kondisi
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Pagination
    query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.execute(query, params);

    // ✅ Count total untuk pagination (menggunakan kondisi yang sama)
    let countQuery = "SELECT COUNT(*) as total FROM books b";
    const countParams = [];
    const countConditions = [];
    
    if (status && status !== 'all') {
      countConditions.push('b.status = ?');
      countParams.push(status);
    }
    
    if (category) {
      countConditions.push('b.category_id = ?');
      countParams.push(category);
    }
    
    if (search) {
      countConditions.push('(b.title LIKE ? OR b.author LIKE ?)');
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("API Error - Books GET:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'development' ? error.message : "Gagal mengambil data buku"
      },
      { status: 500 }
    );
  }
}

// ==================================================
// POST — Tambah buku baru (user mengajukan)
// ==================================================
export async function POST(request) {
  try {
    const { fields, files } = await parseFormData(request);

    const title = fields.title?.trim();
    const author = fields.author?.trim();
    const year = fields.year?.trim();
    const user_id = fields.user_id?.trim();
    const admin_id = fields.admin_id?.trim(); // ✅ Tambahan untuk admin langsung approve
    const category_id = fields.category_id?.trim() || null;
    const stock = parseInt(fields.stock || "1", 10);

    if (!title || !author || !year) {
      return NextResponse.json(
        { success: false, message: "Judul, penulis, dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    // ✅ Jika ada admin_id, berarti admin yang menambah (langsung approved)
    let finalStatus = 'pending';
    let finalStock = 0;
    
    if (admin_id) {
      // Validasi admin
      const [adminCheck] = await db.execute(
        "SELECT id, name FROM users WHERE id = ? AND is_admin = 1",
        [admin_id]
      );
      
      if (adminCheck.length === 0) {
        return NextResponse.json(
          { success: false, message: "Admin tidak ditemukan atau tidak memiliki akses" },
          { status: 403 }
        );
      }
      
      finalStatus = 'approved';
      finalStock = stock;
    } else if (user_id) {
      // Validasi user
      const [userCheck] = await db.execute(
        "SELECT id, name FROM users WHERE id = ?",
        [user_id]
      );

      if (userCheck.length === 0) {
        return NextResponse.json(
          { success: false, message: "User tidak ditemukan" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "User ID atau Admin ID wajib diisi" },
        { status: 400 }
      );
    }

    // Simpan file cover
    let cover_image = null;
    if (files.image) {
      cover_image = await saveFile(files.image);
    }

    // Insert buku
    const [result] = await db.execute(
      `INSERT INTO books 
       (title, author, year, cover_image, status, category_id, user_id, stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, year, cover_image, finalStatus, category_id, user_id || admin_id, finalStock]
    );

    // ✅ Log action
    const actionUser = admin_id || user_id;
    const actionText = admin_id 
      ? `Admin menambahkan buku: ${title}` 
      : `User mengajukan buku: ${title}`;
    
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action) VALUES (?, ?)`,
      [actionUser, actionText]
    );

    return NextResponse.json(
      { 
        success: true,
        message: admin_id 
          ? "✅ Buku berhasil ditambahkan!" 
          : "✅ Buku berhasil diajukan! Menunggu persetujuan admin.",
        id: result.insertId,
        status: finalStatus
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error - Books POST:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'development' ? error.message : "Gagal menambah buku"
      },
      { status: 500 }
    );
  }
}

// ==================================================
// PUT — Edit buku (admin dan user bisa edit)
// ==================================================
export async function PUT(request) {
  try {
    const { fields, files } = await parseFormData(request);

    const id = fields.id?.trim();
    const title = fields.title?.trim();
    const author = fields.author?.trim();
    const year = fields.year?.trim();
    const category_id = fields.category_id?.trim() || null;
    const admin_id = fields.admin_id?.trim() || null;
    const stock = parseInt(fields.stock || "1", 10);

    if (!id || !title || !author || !year) {
      return NextResponse.json(
        { success: false, message: "ID, judul, penulis, dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    // Cek buku ada
    const [existing] = await db.execute(
      "SELECT id, cover_image, status, stock FROM books WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Buku tidak ditemukan" },
        { status: 404 }
      );
    }

    let cover_image = existing[0].cover_image;

    // Jika ada file baru diupload
    if (files.image && files.image.size > 0) {
      // Hapus file lama jika ada
      if (cover_image) {
        const oldPath = path.join(UPLOAD_DIR, cover_image);
        if (fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath).catch(err => 
            console.warn("Gagal menghapus file lama:", err)
          );
        }
      }
      cover_image = await saveFile(files.image);
    }

    // Update database
    await db.execute(
      `UPDATE books 
       SET title = ?, author = ?, year = ?, cover_image = ?, category_id = ?, stock = ? 
       WHERE id = ?`,
      [title, author, year, cover_image, category_id, stock, id]
    );

    // Log admin action
    if (admin_id) {
      await db.execute(
        `INSERT INTO admin_logs (admin_id, action) VALUES (?, ?)`,
        [admin_id, `Mengedit buku: ${title} (ID: ${id})`]
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "✅ Buku berhasil diperbarui",
      updated: { id, title, author, year, stock }
    });
  } catch (error) {
    console.error("API Error - Books PUT:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'development' ? error.message : "Gagal mengupdate buku"
      },
      { status: 500 }
    );
  }
}

// ==================================================
// PATCH — Hanya untuk perubahan status (approval/reject)
// ==================================================
export async function PATCH(request) {
  try {
    const { id, status, admin_id, reason } = await request.json();

    if (!id || !status || !admin_id) {
      return NextResponse.json(
        { success: false, message: "ID buku, status, dan admin ID wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status tidak valid. Gunakan: pending, approved, atau rejected" },
        { status: 400 }
      );
    }

    // Cek buku
    const [book] = await db.execute(
      "SELECT id, title, status, stock FROM books WHERE id = ?",
      [id]
    );

    if (book.length === 0) {
      return NextResponse.json(
        { success: false, message: "Buku tidak ditemukan" },
        { status: 404 }
      );
    }

    // ✅ PERBAIKAN: Handle status change
    if (status === 'approved') {
      // Jika sebelumnya pending/rejected, tambahkan stock
      if (book[0].status !== 'approved') {
        await db.execute(
          "UPDATE books SET stock = stock + 1, status = 'approved' WHERE id = ?",
          [id]
        );
      } else {
        // Sudah approved, hanya update status
        await db.execute(
          "UPDATE books SET status = 'approved' WHERE id = ?",
          [id]
        );
      }
    } 
    else if (status === 'rejected') {
      await db.execute(
        "UPDATE books SET status = 'rejected', admin_notes = ? WHERE id = ?",
        [reason || 'Ditolak oleh admin', id]
      );
    }
    else if (status === 'pending') {
      await db.execute(
        "UPDATE books SET status = 'pending' WHERE id = ?",
        [id]
      );
    }

    // Log admin action
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action) VALUES (?, ?)`,
      [
        admin_id, 
        `${status === 'approved' ? 'Menyetujui' : status === 'rejected' ? 'Menolak' : 'Mengubah status'} buku: ${book[0].title} (ID: ${id})${reason ? ` - Alasan: ${reason}` : ''}`
      ]
    );

    return NextResponse.json({ 
      success: true,
      message: `✅ Buku berhasil ${status === 'approved' ? 'disetujui' : status === 'rejected' ? 'ditolak' : 'diubah statusnya'}`,
      book_id: id,
      new_status: status
    });
  } catch (error) {
    console.error("API Error - Books PATCH:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'development' ? error.message : "Gagal mengubah status buku"
      },
      { status: 500 }
    );
  }
}

// ==================================================
// DELETE — Hapus buku
// ==================================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const admin_id = searchParams.get("admin_id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID buku wajib dikirim" },
        { status: 400 }
      );
    }

    // Cek buku
    const [book] = await db.execute(
      "SELECT id, title, cover_image FROM books WHERE id = ?",
      [id]
    );

    if (book.length === 0) {
      return NextResponse.json(
        { success: false, message: "Buku tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hapus file cover jika ada
    if (book[0]?.cover_image) {
      const imgPath = path.join(UPLOAD_DIR, book[0].cover_image);
      if (fs.existsSync(imgPath)) {
        await fs.promises.unlink(imgPath).catch(err => 
          console.warn("Gagal menghapus file cover:", err)
        );
      }
    }

    // Hapus dari database
    await db.execute("DELETE FROM books WHERE id = ?", [id]);

    // Log admin action
    if (admin_id) {
      await db.execute(
        `INSERT INTO admin_logs (admin_id, action) VALUES (?, ?)`,
        [admin_id, `Menghapus buku: ${book[0].title} (ID: ${id})`]
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "✅ Buku berhasil dihapus",
      deleted_id: id
    });
  } catch (error) {
    console.error("API Error - Books DELETE:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'development' ? error.message : "Gagal menghapus buku"
      },
      { status: 500 }
    );
  }
}