"use client";
import { useState, useEffect } from "react";
import Header from "../../components/header.jsx";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBook, setCurrentBook] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    year: "",
    stock: 1,
    status: "approved"
  });

  // Data dummy sesuai gambar
  const dummyBooks = [
    {
      id: 1,
      title: "Fallback Book - Database Error",
      author: "System",
      year: "2024",
      stock: 0,
      status: "approved",
      cover_image: null,
      created_at: "2024-12-04T23:51:00Z"
    }
  ];

  useEffect(() => {
  fetchBooks();
}, []);

const fetchBooks = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/books?status=all');
    const data = await response.json();
    if (data.success) {
      setBooks(data.data);
    } else {
      alert('Gagal mengambil data buku: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error fetching books:', error);
    alert('Terjadi kesalahan saat mengambil data buku.');
  } finally {
    setLoading(false);
  }
};
  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle add book
  const handleAddBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulasi API call
    setTimeout(() => {
      const newBook = {
        id: books.length + 1,
        ...formData,
        cover_image: null,
        created_at: new Date().toISOString()
      };
      
      setBooks([...books, newBook]);
      setShowAddModal(false);
      setFormData({
        title: "",
        author: "",
        year: "",
        stock: 1,
        status: "approved"
      });
      setLoading(false);
      alert("✅ Buku berhasil ditambahkan!");
    }, 1000);
  };

  // Handle edit book
  const handleEditBook = (book) => {
    setCurrentBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      year: book.year,
      stock: book.stock,
      status: book.status
    });
    setShowEditModal(true);
  };

  // Handle update book
  const handleUpdateBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulasi API call
    setTimeout(() => {
      const updatedBooks = books.map(book => 
        book.id === currentBook.id 
          ? { ...book, ...formData }
          : book
      );
      
      setBooks(updatedBooks);
      setShowEditModal(false);
      setCurrentBook(null);
      setFormData({
        title: "",
        author: "",
        year: "",
        stock: 1,
        status: "approved"
      });
      setLoading(false);
      alert("✅ Buku berhasil diperbarui!");
    }, 1000);
  };

  // Handle delete book
  const handleDeleteBook = (id) => {
    if (confirm("⚠️ Yakin ingin menghapus buku ini?")) {
      setLoading(true);
      
      // Simulasi API call
      setTimeout(() => {
        const filteredBooks = books.filter(book => book.id !== id);
        setBooks(filteredBooks);
        setLoading(false);
        alert("✅ Buku berhasil dihapus!");
      }, 1000);
    }
  };

  // Filter books
  const filteredBooks = books
    .filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        book.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "author") {
        return a.author.localeCompare(b.author);
      }
      if (sortBy === "year") {
        return b.year - a.year;
      }
      if (sortBy === "stock") {
        return b.stock - a.stock;
      }
      return 0;
    });

  // Get status label
  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "Menunggu",
      approved: "Disetujui",
      rejected: "Ditolak"
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Header />
      
      <div className="p-8">
        {/* Total Books Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Buku di Database</p>
              <p className="text-3xl font-bold">{books.length} Buku</p>
            </div>
            <div className="text-5xl opacity-20">📚</div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Cari judul atau penulis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              >
                <option value="all">Semua Status</option>
                <option value="approved">Disetujui</option>
                <option value="pending">Menunggu</option>
                <option value="rejected">Ditolak</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              >
                <option value="title">Urutkan: Judul</option>
                <option value="author">Urutkan: Penulis</option>
                <option value="year">Urutkan: Tahun</option>
                <option value="stock">Urutkan: Stok</option>
              </select>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ➕ Tambah Buku
              </button>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin text-4xl mb-4">⟳</div>
              <p className="text-gray-600">Memuat data buku...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-600">Tidak ada buku ditemukan</p>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-xl shadow hover:shadow-lg transition">
                {/* Book Cover */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {book.cover_image ? (
                    <img
                      src={`/uploads/${book.cover_image}`}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">
                      📚
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(book.status)}`}>
                      {getStatusLabel(book.status)}
                    </span>
                  </div>
                  
                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
                    Stok: {book.stock}
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-1">
                    ✍️ {book.author}
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    📅 {book.year}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditBook(book)}
                      className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-medium hover:bg-yellow-600 transition text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition text-sm"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-blue-600 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">➕ Tambah Buku Baru</h2>
            </div>
            
            <form onSubmit={handleAddBook} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Buku *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Masukkan judul buku"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penulis *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama penulis"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Terbit *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="2024"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                >
                  <option value="approved">Disetujui</option>
                  <option value="pending">Menunggu</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "⏳ Menyimpan..." : "💾 Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      title: "",
                      author: "",
                      year: "",
                      stock: 1,
                      status: "approved"
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditModal && currentBook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-yellow-500 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">✏️ Edit Buku</h2>
              <p className="text-sm opacity-90">ID: #{currentBook.id}</p>
            </div>
            
            <form onSubmit={handleUpdateBook} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Buku *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penulis *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Terbit *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                >
                  <option value="approved">Disetujui</option>
                  <option value="pending">Menunggu</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-yellow-500 text-white py-3 rounded-lg font-medium hover:bg-yellow-600 transition disabled:opacity-50"
                >
                  {loading ? "⏳ Memperbarui..." : "💾 Update"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentBook(null);
                    setFormData({
                      title: "",
                      author: "",
                      year: "",
                      stock: 1,
                      status: "approved"
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}