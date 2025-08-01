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

// Komponen AddUserForm untuk menambah user baru dengan role admin/user
export default function AddUserForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  handleAddUser, // Handler function untuk menambah user ke sistem
}) {
  // State management untuk form fields
  const [name, setName] = useState(""); // Nama lengkap user
  const [email, setEmail] = useState(""); // Email user untuk login
  const [password, setPassword] = useState(""); // Password user
  const [isAdmin, setIsAdmin] = useState(false); // Flag untuk role admin
  const [loading, setLoading] = useState(false); // State loading untuk submit

  // Handler untuk submit form user baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state
    
    try {
      // Prepare data user untuk dikirim ke API
      // Prepare data user untuk dikirim ke API
      const formData = {
        name, // Nama lengkap user
        email, // Email untuk authentication
        password, // Password yang akan di-hash
        is_admin: isAdmin // Role admin (true/false)
      };
      
      // Panggil handler dari parent component
      const success = await handleAddUser(formData);
      if (success) {
        // Reset form setelah berhasil menambah user
        setName("");
        setEmail("");
        setPassword("");
        setIsAdmin(false);
        setOpen(false); // Tutup modal
      }
    } catch (error) {
      console.error("Error adding user:", error);
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
      title="Tambah User Baru" // Judul modal
      description="Buat akun user baru dengan peran yang sesuai" // Deskripsi modal
      form={formContent} // Content form yang akan ditampilkan
      formHandle={handleSubmit} // Handler submit form
      confirmText="Tambah User" // Text tombol konfirmasi
      cancelText="Batal" // Text tombol cancel
      loading={loading} // State loading untuk disable tombol saat submit
    />
  );
}
