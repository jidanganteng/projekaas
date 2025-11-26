export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-center p-8 mt-12 shadow-inner">
      <p className="text-lg font-semibold">&copy; {new Date().getFullYear()} Perpustakaan. All rights reserved.</p>
      <p className="text-sm mt-1 text-gray-200 animate-pulse">Developed with ❤️ by YourName</p>
    </footer>
  );
}
