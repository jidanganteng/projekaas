'use client';
export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Decorative Top Border */}
      <div className="h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500"></div>
      
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Digital Library
                </h2>
                <p className="text-xs text-gray-400">Perpustakaan Digital</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Transformasi digital untuk akses pengetahuan yang lebih mudah dan efisien bagi seluruh civitas akademika.
            </p>
            <div className="flex space-x-4">
              {['📘', '📗', '📙', '📕'].map((icon, idx) => (
                <div 
                  key={idx}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center hover:scale-110 transition-transform duration-300"
                >
                  <span className="text-lg">{icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {['Dashboard', 'Koleksi Buku', 'Peminjaman', 'Riwayat', 'FAQ'].map((item, idx) => (
                <li key={idx}>
                  <a 
                    href="#" 
                    className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 flex items-center group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    <span className="ml-2">{item}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Kontak Kami
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  📍
                </div>
                <p className="text-sm text-gray-300">
                  Jl. Perpustakaan No. 123<br/>
                  Kota Akademik, 12345
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  📧
                </div>
                <p className="text-sm text-gray-300">library@digital.ac.id</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  📞
                </div>
                <p className="text-sm text-gray-300">(021) 1234-5678</p>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
              Stay Updated
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Dapatkan notifikasi tentang buku baru dan acara perpustakaan.
            </p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Email address"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-r-lg hover:opacity-90 transition-opacity">
                →
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Kami tidak akan mengirim spam. Janji!
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-800"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left">
            <p className="text-gray-300">
              &copy; {new Date().getFullYear()} <span className="font-semibold text-white">Digital Library</span>. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Made with <span className="text-red-500 animate-pulse">❤️</span> by <span className="text-purple-400">Library Development Team</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">v2.1.0</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Floating Books Animation */}
        <div className="relative h-0 overflow-visible">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="absolute text-2xl opacity-10 animate-float"
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i}s`
              }}
            >
              {['📖', '📚', '📕', '📗', '📘'][i]}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Animation */}
    </footer>
  );
}