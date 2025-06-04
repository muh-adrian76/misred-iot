"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsDialog({ open, setOpen }) {
  const [tab, setTab] = useState("profile");
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleProfileSave = (e) => {
    e.preventDefault();
    // TODO: Kirim data ke backend
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="device">Device</TabsTrigger>
            <TabsTrigger value="alarms">Alarms</TabsTrigger>
          </TabsList>
          {/* Profile Tab */}
          <TabsContent value="profile">
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="oldPassword">Password Lama</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </DialogClose>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </TabsContent>
          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div>Pengaturan dashboard di sini.</div>
          </TabsContent>
          {/* Device Tab */}
          <TabsContent value="device">
            <div>Pengaturan device di sini.</div>
          </TabsContent>
          {/* Alarms Tab */}
          <TabsContent value="alarms">
            <div>Pengaturan alarms di sini.</div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}