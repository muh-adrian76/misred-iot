"use client";
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { fetchFromBackend } from "@/lib/helper";

export default function UploadFirmwareForm({
  open,
  setOpen,
  device,
  onUploaded,
}) {
  const [firmwareVersion, setFirmwareVersion] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFirmwareVersion("");
      setFile(null);
      setUploading(false);
    }
  }, [open]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const allowedExt = [".bin", ".hex"];
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExt.includes(ext)) {
        errorToast("Hanya file .bin atau .hex yang diperbolehkan");
        e.target.value = ""; // reset input
        setFile(null);
        return;
      }
      setFile(file);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      errorToast("Pilih file firmware terlebih dahulu");
      return;
    }
    setUploading(true);
    try {
      // 1. Baca file sebagai base64
      const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Kirim sebagai JSON
      const res = await fetchFromBackend(
        `/device/firmware/upload/${device.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firmware_version: firmwareVersion,
            filename: file.name,
            file_base64: fileBase64,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      successToast("Firmware berhasil diupload!");
      setOpen(false);
      setFirmwareVersion("");
      setFile(null);
      // Update data table
      if (onUploaded) onUploaded(data);
    } catch (err) {
      console.error("Upload firmware error:", err);
      errorToast("Gagal upload firmware", err.message);
    } finally {
      setUploading(false);
    }
  };

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="firmwareVersion" className="text-left ml-1 font-medium">
          Versi Firmware
        </Label>
        <Input
          id="firmwareVersion"
          value={firmwareVersion}
          onChange={(e) => setFirmwareVersion(e.target.value)}
          placeholder="Contoh: v1.0.2"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="firmwareFile" className="text-left ml-1 font-medium">
          File Firmware (.bin atau .hex)
        </Label>
        <Input
          id="firmwareFile"
          type="file"
          accept=".bin,.hex"
          onChange={handleFileChange}
          noInfo
          required
        />
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title={
        <>
          Upload Firmware untuk{" "}
          <i>{device?.description || `Device #${device?.id}`}</i>
        </>
      }
      form={formContent}
      formHandle={handleSubmit}
      confirmText={uploading ? "Mengupload..." : "Upload"}
      cancelText="Batalkan"
      confirmDisabled={uploading}
    />
  );
}
