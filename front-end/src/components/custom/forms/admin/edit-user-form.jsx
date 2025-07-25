"use client";
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Crown } from "lucide-react";
import { useState, useEffect } from "react";

export default function EditUserForm({
  open,
  setOpen,
  editUser,
  handleEditUser,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editUser) {
      setName(editUser.name || "");
      setEmail(editUser.email || "");
      setIsAdmin(editUser.is_admin || false);
    }
  }, [editUser, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = {
        name,
        email,
        is_admin: isAdmin
      };
      
      const success = await handleEditUser(editUser.id, formData);
      if (success) {
        setOpen(false);
      }
    } catch (error) {
      console.error("Error editing user:", error);
    } finally {
      setLoading(false);
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
