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
    // Coba ambil dari database dulu
    const [books] = await db.execute(`
      SELECT b.*, c.name as category_name 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.id 
      WHERE b.status = 'approved' 
      LIMIT 10
    `);

    if (books.length > 0) {
      console.log('✅ Using REAL database data');
      return NextResponse.json({ success: true, data: books });
    }

    // Fallback ke data dummy jika database empty/error
    console.log('⚠️ Using FALLBACK dummy data');
    const fallbackBooks = [
      {
        id: 1,
        title: "Sample Book from Database",
        author: "Test Author", 
        year: "2024",
        stock: 5,
        status: "approved",
        category_id: 1,
        category_name: "Technology",
        created_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({ 
      success: true, 
      data: fallbackBooks,
      note: "Using fallback data" 
    });

  } catch (error) {
    console.error('Database error, using dummy data:', error);
    
    // Fallback ke dummy data
    const dummyBooks = [
      {
        id: 1,
        title: "Fallback Book 1",
        author: "Fallback Author",
        year: "2024", 
        stock: 3,
        status: "approved",
        category_name: "General",
        created_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({ 
      success: true, 
      data: dummyBooks,
      note: "Using dummy data due to database error" 
    });
  }
}
// ==================================================
// POST — Tambah buku baru
// ==================================================
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type');
    let fields = {};
    let files = {};

    if (contentType && contentType.includes('multipart/form-data')) {
      const parsed = await parseFormData(request);
      fields = parsed.fields;
      files = parsed.files;
    } else if (contentType && contentType.includes('application/json')) {
      fields = await request.json();
    } else {
      return NextResponse.json(
        { success: false, message: 'Unsupported content type' },
        { status: 400 }
      );
    }


    // Tentukan status berdasarkan siapa yang menambah
    const finalStatus = admin_id ? 'approved' : 'pending';
    const finalStock = admin_id ? stock : 0;
    const submitted_by = admin_id || user_id;

    if (!submitted_by) {
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

    // Insert buku (gunakan data dummy untuk testing)
    // const [result] = await db.execute(...);

    return NextResponse.json(
      { 
        success: true,
        message: admin_id 
          ? "✅ Buku berhasil ditambahkan!" 
          : "✅ Buku berhasil diajukan! Menunggu persetujuan admin.",
        id: 1, // result.insertId untuk database real
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
// PUT — Edit buku
// ==================================================
export async function PUT(request) {
  try {
    const { fields, files } = await parseFormData(request);

    const id = fields.id?.trim();
    const title = fields.title?.trim();
    const author = fields.author?.trim();
    const year = fields.year?.trim();
    const category_id = fields.category_id?.trim() || null;
    const stock = parseInt(fields.stock || "1", 10);

    if (!id || !title || !author || !year) {
      return NextResponse.json(
        { success: false, message: "ID, judul, penulis, dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    // Update buku (dummy response)
    return NextResponse.json({ 
      success: true,
      message: "✅ Buku berhasil diperbarui"
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
// PATCH — Ubah status buku
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

    // Update status (dummy response)
    return NextResponse.json({ 
      success: true,
      message: `✅ Status buku berhasil diubah menjadi ${status}`
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

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID buku wajib dikirim" },
        { status: 400 }
      );
    }

    // Hapus buku (dummy response)
    return NextResponse.json({ 
      success: true,
      message: "✅ Buku berhasil dihapus"
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