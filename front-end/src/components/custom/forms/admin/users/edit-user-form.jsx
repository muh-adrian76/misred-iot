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

// Komponen EditUserForm untuk mengedit data user yang sudah ada
export default function EditUserForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  editUser, // Data user yang akan diedit
  handleEditUser, // Handler function untuk update user
}) {
  // State management untuk form fields
  const [name, setName] = useState(""); // Nama lengkap user
  const [email, setEmail] = useState(""); // Email user
  const [isAdmin, setIsAdmin] = useState(false); // Flag untuk role admin
  const [loading, setLoading] = useState(false); // State loading untuk submit

  // Effect untuk populate form dengan data user yang akan diedit
  useEffect(() => {
    if (editUser) {
      setName(editUser.name || ""); // Set nama dari data user
      setEmail(editUser.email || ""); // Set email dari data user
      setIsAdmin(editUser.is_admin || false); // Set admin status dari data user
    }
  }, [editUser, open]); // Re-run saat editUser atau modal open berubah

  // Handler untuk submit form edit user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state
    
    try {
      // Prepare data user untuk update (tanpa password)
      const formData = {
        name, // Nama yang sudah diupdate
        email, // Email yang sudah diupdate
        is_admin: isAdmin // Role admin yang sudah diupdate
      };
      
      // Panggil handler dari parent component dengan ID user
      const success = await handleEditUser(editUser.id, formData);
      if (success) {
        setOpen(false); // Tutup modal setelah berhasil update
      }
    } catch (error) {
      console.error("Error editing user:", error);
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
      title="Edit User"
      description={`Ubah informasi untuk ${editUser?.name || 'user'}`}
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Update User"
      cancelText="Batal"
      loading={loading}
    />
  );
}
