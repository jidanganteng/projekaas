"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      router.push("/auth/login");
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setEditForm({
        name: parsedUser.name || "",
        email: parsedUser.email || "",
      });
    }
  }, []);

  const handleSaveProfile = () => {
    // Update localStorage with new data
    const updatedUser = { ...user, ...editForm };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    alert("✅ Profil berhasil diperbarui!");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">👤</div>
          <p className="text-2xl font-semibold text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Avatar pertama dari huruf nama
  const avatarChar = user.name ? user.name.charAt(0).toUpperCase() : "U";

  // Generate avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-pink-500 to-pink-600",
      "from-green-500 to-green-600",
      "from-orange-500 to-orange-600",
      "from-red-500 to-red-600",
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
        >
          <span className="text-xl">←</span>
          <span className="font-semibold">Kembali</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          {/* Header Section with Gradient */}
          <div className="relative h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-r ${getAvatarColor(
                  user.name
                )} text-white flex items-center justify-center text-5xl font-bold shadow-2xl border-8 border-white`}
              >
                {avatarChar}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="pt-20 pb-8 px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{user.name}</h1>
              <p className="text-gray-500 text-lg">{user.email}</p>
              <span className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-semibold">
                {user.role === "admin" ? "👑 Administrator" : "👤 User"}
              </span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">📚</div>
                <div className="text-2xl font-bold text-blue-700">0</div>
                <div className="text-sm text-blue-600">Buku Dipinjam</div>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">❤️</div>
                <div className="text-2xl font-bold text-pink-700">0</div>
                <div className="text-sm text-pink-600">Buku Favorit</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-2xl font-bold text-purple-700">0</div>
                <div className="text-sm text-purple-600">Total Aktivitas</div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📋 Informasi Profil</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-semibold"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      👤 Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📧 Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                      placeholder="Masukkan email"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                    >
                      ✅ Simpan Perubahan
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          name: user.name || "",
                          email: user.email || "",
                        });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-400 transition"
                    >
                      ❌ Batal
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-white rounded-xl">
                    <div className="text-3xl">👤</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-semibold">Nama Lengkap</p>
                      <p className="text-lg text-gray-800 font-medium">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white rounded-xl">
                    <div className="text-3xl">📧</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-semibold">Email</p>
                      <p className="text-lg text-gray-800 font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white rounded-xl">
                    <div className="text-3xl">🔑</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-semibold">Role</p>
                      <p className="text-lg text-gray-800 font-medium capitalize">{user.role}</p>
                    </div>
                  </div>

                  {user.created_at && (
                    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl">
                      <div className="text-3xl">📅</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 font-semibold">Akun Dibuat</p>
                        <p className="text-lg text-gray-800 font-medium">
                          {new Date(user.created_at).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Settings */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">⚙️ Pengaturan Akun</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔒</span>
                    <span className="font-semibold text-gray-700">Ubah Password</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔔</span>
                    <span className="font-semibold text-gray-700">Notifikasi</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🌙</span>
                    <span className="font-semibold text-gray-700">Mode Gelap</span>
                  </div>
                  <div className="bg-gray-200 w-12 h-6 rounded-full"></div>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl hover:shadow-2xl transition font-bold text-lg flex items-center justify-center space-x-3"
            >
              <span className="text-2xl">🚪</span>
              <span>Logout dari Akun</span>
            </button>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center">
          <p className="text-lg font-semibold">
            💡 Tips: Jaga keamanan akun Anda dengan tidak membagikan password ke siapapun!
          </p>
        </div>
      </div>
    </div>
  );
}