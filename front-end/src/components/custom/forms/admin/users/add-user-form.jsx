"use client";

// Import komponen dialog responsif untuk modal form
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";

// Import komponen UI untuk form elements
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Import icons untuk visual indicators
import { User, Mail, Lock, Crown } from "lucide-react";
import { useState } from "react";

// Komponen AddUserForm untuk menambah pengguna baru dengan peran admin / pengguna biasa
export default function AddUserForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  handleAddUser, // Fungsi handler untuk menambah pengguna ke sistem
}) {
  // State management untuk field formulir
  const [name, setName] = useState(""); // Nama lengkap pengguna
  const [email, setEmail] = useState(""); // Email pengguna untuk login
  const [password, setPassword] = useState(""); // Password pengguna
  const [isAdmin, setIsAdmin] = useState(false); // Penanda apakah diberikan peran admin
  const [loading, setLoading] = useState(false); // Status loading saat submit

  // Handler untuk submit form pengguna baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state
    
    try {
  // Siapkan data pengguna untuk dikirim ke API
      const formData = {
  name, // Nama lengkap pengguna
  email, // Email untuk autentikasi
  password, // Password (akan di-hash di server)
  is_admin: isAdmin // Peran admin (true/false)
      };
      
  // Panggil handler dari komponen induk
      const success = await handleAddUser(formData);
      if (success) {
        // Reset form setelah berhasil menambah pengguna
        setName("");
        setEmail("");
        setPassword("");
        setIsAdmin(false);
        setOpen(false); // Tutup modal
      }
    } catch (error) {
      console.error("Kesalahan menambah pengguna:", error);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Layout form content dengan input fields
  const formContent = (
    <div className="flex flex-col gap-4">
      {/* Input Field: Nama Lengkap */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-left ml-1 font-medium max-sm:text-xs">
          Nama Lengkap
        </Label>
        <div className="relative">
          {/* Icon user di dalam input */}
          <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="name"
            type="text"
            className="w-full pl-10" // Padding left untuk icon
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            noInfo
            required
          />
        </div>
      </div>

      {/* Input Field: Email */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-left ml-1 font-medium max-sm:text-xs">
          Email
        </Label>
        <div className="relative">
          {/* Icon email di dalam input */}
          <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="email"
            type="email"
            className="w-full pl-10" // Padding left untuk icon
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contoh@email.com"
            noInfo
            required
          />
        </div>
      </div>

      {/* Input Field: Password */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-left ml-1 font-medium max-sm:text-xs">
          Password
        </Label>
        <div className="relative">
          {/* Icon lock di dalam input */}
          <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="password"
            type="password"
            className="w-full pl-10" // Padding left untuk icon
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            noInfo
            required
          />
        </div>
      </div>

      {/* Checkbox: Role Admin */}
      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id="is_admin"
          checked={isAdmin}
          onCheckedChange={setIsAdmin} // Handler untuk toggle admin role
        />
        <Label
          htmlFor="is_admin"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
        >
          {/* Icon crown untuk menunjukkan admin role */}
          <Crown className="w-4 h-4 text-purple-600" />
          Berikan akses admin
        </Label>
      </div>
    </div>
  );

  // Render ResponsiveDialog dengan form content
  return (
    <ResponsiveDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Handler untuk close modal
  title="Tambah Pengguna Baru" // Judul modal
  description="Buat akun pengguna baru dengan peran yang sesuai" // Deskripsi modal
      form={formContent} // Content form yang akan ditampilkan
      formHandle={handleSubmit} // Handler submit form
  confirmText="Tambah Pengguna" // Teks tombol konfirmasi
      cancelText="Batal" // Text tombol cancel
      loading={loading} // State loading untuk disable tombol saat submit
    />
  );
}
