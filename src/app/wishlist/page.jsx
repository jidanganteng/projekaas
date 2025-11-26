"use client";
import React, { useState, useEffect } from 'react';
import { Heart, Trash2, BookOpen, User, Calendar, Search } from 'lucide-react';

// Simulasi data untuk demo (dalam aplikasi nyata, ini dari API)
const mockWishlistData = [
  {
    id: 1,
    book: {
      id: 1,
      title: "Laskar Pelangi",
      author: "Andrea Hirata",
      cover_image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300",
      category: "Novel",
      year: "2005",
      stock: 5
    },
    created_at: "2024-01-15T10:30:00"
  },
  {
    id: 2,
    book: {
      id: 2,
      title: "Belajar JavaScript Modern",
      author: "John Doe",
      cover_image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300",
      category: "Teknologi",
      year: "2023",
      stock: 3
    },
    created_at: "2024-01-16T14:20:00"
  },
  {
    id: 3,
    book: {
      id: 3,
      title: "Filosofi Teras",
      author: "Henry Manampiring",
      cover_image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300",
      category: "Biografi",
      year: "2019",
      stock: 2
    },
    created_at: "2024-01-17T09:15:00"
  }
];

const WishlistApp = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Simulasi fetch data
  useEffect(() => {
    setTimeout(() => {
      setWishlist(mockWishlistData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRemoveFromWishlist = (id) => {
    if (confirm('Hapus buku ini dari wishlist?')) {
      setWishlist(wishlist.filter(item => item.id !== id));
      // Dalam aplikasi nyata:
      // await fetch('/api/favorites', { method: 'DELETE', body: JSON.stringify({ id }) });
    }
  };

  const filteredWishlist = wishlist.filter(item => {
    const matchesSearch = item.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'Novel', 'Teknologi', 'Biografi', 'Pelajaran', 'Sains', 'Agama'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Memuat wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-purple-600 fill-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Wishlist Saya</h1>
            </div>
            <div className="flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-full">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-700">{wishlist.length} Buku</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter & Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari judul atau penulis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Wishlist Grid */}
        {filteredWishlist.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Wishlist Kosong</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Tidak ada buku yang sesuai dengan pencarian'
                : 'Belum ada buku di wishlist Anda'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Book Cover */}
                <div className="relative h-64 overflow-hidden bg-gray-200">
                  <img
                    src={item.book.cover_image}
                    alt={item.book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                      title="Hapus dari wishlist"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {item.book.category}
                    </span>
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-5">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                    {item.book.title}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <User className="w-4 h-4 mr-2" />
                      <span>{item.book.author}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Tahun: {item.book.year}</span>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Stok:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.book.stock > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.book.stock > 0 ? `${item.book.stock} tersedia` : 'Habis'}
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      item.book.stock > 0
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={item.book.stock === 0}
                  >
                    {item.book.stock > 0 ? 'Pinjam Buku' : 'Stok Habis'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistApp;