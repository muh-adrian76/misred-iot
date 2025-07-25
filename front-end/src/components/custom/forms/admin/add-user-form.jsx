"use client";
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Crown } from "lucide-react";
import { useState } from "react";

export default function AddUserForm({
  open,
  setOpen,
  handleAddUser,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = {
        name,
        email,
        password,
        is_admin: isAdmin
      };
      
      const success = await handleAddUser(formData);
      if (success) {
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setIsAdmin(false);
        setOpen(false);
      }
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="flex flex-col gap-4">
      {/* Input: Nama */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-left ml-1 font-medium max-sm:text-xs">
          Nama Lengkap
        </Label>
        <div className="relative">
          <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="name"
            type="text"
            className="w-full pl-10"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            noInfo
            required
          />
        </div>
      </div>

      {/* Input: Email */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-left ml-1 font-medium max-sm:text-xs">
          Email
        </Label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="email"
            type="email"
            className="w-full pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contoh@email.com"
            noInfo
            required
          />
        </div>
      </div>

      {/* Input: Password */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-left ml-1 font-medium max-sm:text-xs">
          Password
        </Label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="password"
            type="password"
            className="w-full pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            noInfo
            required
          />
        </div>
      </div>

      {/* Checkbox: Admin Role */}
      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id="is_admin"
          checked={isAdmin}
          onCheckedChange={setIsAdmin}
        />
        <Label
          htmlFor="is_admin"
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
      title="Tambah User Baru"
      description="Buat akun user baru dengan peran yang sesuai"
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Tambah User"
      cancelText="Batal"
      loading={loading}
    />
  );
}
