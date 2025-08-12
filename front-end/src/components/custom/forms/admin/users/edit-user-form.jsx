"use client";

// Import komponen dialog responsif untuk modal form
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";

// Import komponen UI untuk form elements
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Import icons untuk visual indicators
import { User, Mail, Crown } from "lucide-react";
import { useState, useEffect } from "react";

// Komponen EditUserForm untuk mengedit data pengguna yang sudah ada
export default function EditUserForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  editUser, // Data pengguna yang akan diedit
  handleEditUser, // Fungsi handler untuk memperbarui data pengguna
}) {
  // State management untuk field formulir
  const [name, setName] = useState(""); // Nama lengkap pengguna
  const [email, setEmail] = useState(""); // Email pengguna
  const [isAdmin, setIsAdmin] = useState(false); // Penanda peran admin
  const [loading, setLoading] = useState(false); // Status loading saat submit

  // Effect untuk mengisi form dengan data pengguna yang akan diedit
  useEffect(() => {
    if (editUser) {
  setName(editUser.name || ""); // Set nama dari data pengguna
  setEmail(editUser.email || ""); // Set email dari data pengguna
  setIsAdmin(editUser.is_admin || false); // Set status admin dari data pengguna
    }
  }, [editUser, open]); // Re-run saat editUser atau modal open berubah

  // Handler untuk submit form edit pengguna
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state
    
    try {
  // Siapkan data pengguna untuk update (tanpa password)
      const formData = {
  name, // Nama yang diperbarui
  email, // Email yang diperbarui
  is_admin: isAdmin // Peran admin yang diperbarui
      };
      
  // Panggil handler dari komponen induk dengan ID pengguna
      const success = await handleEditUser(editUser.id, formData);
      if (success) {
        setOpen(false); // Tutup modal setelah berhasil memperbarui
      }
    } catch (error) {
      console.error("Kesalahan mengedit pengguna:", error);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const formContent = (
    <div className="flex flex-col gap-4">
      {/* Input: Nama */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="nameEdit" className="text-left ml-1 font-medium max-sm:text-xs">
          Nama Lengkap
        </Label>
        <div className="relative">
          <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="nameEdit"
            type="text"
            className="w-full pl-10"
            value={name}
            noInfo
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            required
          />
        </div>
      </div>

      {/* Input: Email */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="emailEdit" className="text-left ml-1 font-medium max-sm:text-xs">
          Email
        </Label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="emailEdit"
            type="email"
            className="w-full pl-10"
            value={email}
            noInfo
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>
      </div>

      {/* Checkbox: Admin Role */}
      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id="is_admin_edit"
          checked={isAdmin}
          onCheckedChange={setIsAdmin}
        />
        <Label
          htmlFor="is_admin_edit"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
        >
          <Crown className="w-4 h-4 text-purple-600" />
          Berikan akses admin
        </Label>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
  title="Edit Pengguna"
  description={`Ubah informasi untuk ${editUser?.name || 'pengguna'}`}
      form={formContent}
      formHandle={handleSubmit}
  confirmText="Perbarui Pengguna"
      cancelText="Batal"
      loading={loading}
    />
  );
}
