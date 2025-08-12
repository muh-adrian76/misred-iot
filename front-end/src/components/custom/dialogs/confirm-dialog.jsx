// Import komponen AlertDialog dari UI library
import {
  AlertDialog, // Container utama dialog
  AlertDialogAction, // Button untuk aksi konfirmasi
  AlertDialogCancel, // Button untuk aksi batal
  AlertDialogContent, // Konten dialog
  AlertDialogDescription, // Deskripsi dialog
  AlertDialogFooter, // Footer dengan button actions
  AlertDialogHeader, // Header dialog
  AlertDialogTitle, // Judul dialog
} from "@/components/ui/alert-dialog";
// Import efek glow untuk styling
import { GlowingEffect } from "@/components/ui/glowing-effect";

// Komponen dialog konfirmasi yang reusable untuk berbagai aksi destructive
export default function ConfirmDialog({
  open, // State apakah dialog terbuka
  setOpen, // Setter untuk mengontrol state dialog
  title, // Judul dialog
  description, // Deskripsi / pesan konfirmasi
  checkbox = false, // Komponen checkbox opsional (misal: centang "Saya mengerti")
  confirmHandle, // Fungsi handler ketika user menekan konfirmasi
  confirmText = "Konfirmasi", // Teks tombol konfirmasi (default)
  cancelText = "Batal", // Teks tombol batal (default)
  confirmDisabled = false, // Jika true, tombol konfirmasi dinonaktifkan
}) {
  return (
    // AlertDialog dengan state controlled
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="w-96 border rounded-2xl">
        {/* Efek glow untuk visual enhancement */}
        <GlowingEffect
          spread={45} // Jarak spread efek glow
          glow={true} // Enable glow effect
          disabled={false} // Tidak disabled
          proximity={72} // Jarak proximity detection
          inactiveZone={0.02} // Zone tidak aktif
        />
        {/* Header dialog dengan judul dan deskripsi */}
        <AlertDialogHeader>
          <AlertDialogTitle className="text-balance">{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || "Apakah Anda yakin ingin melanjutkan aksi ini?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Render checkbox jika disediakan */}
        {checkbox}
        {/* Footer dengan action buttons */}
        <AlertDialogFooter>
          {/* Button konfirmasi */}
          <AlertDialogAction
            className="cursor-pointer transition-all duration-500"
            onClick={confirmHandle} // Handler untuk aksi konfirmasi
            disabled={confirmDisabled} // Status disabled
          >
            {confirmText}
          </AlertDialogAction>
          {/* Button batal */}
          <AlertDialogCancel className="cursor-pointer transition-all duration-500">
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
