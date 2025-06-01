import { toast } from "sonner"

// @param {"success"|"error"|"info"|"warning"} type - Jenis toast.
// @param {string} message - Keterangan utama.
// @param {string} description - Deskripsi tambahan.
// @param {React.ReactNode} icon - Ikon opsional.
// @param {number} duration

export function showToast(type, message, description) {
  toast[type](message, {
    description,
    duration: 3500,
    position: "top-center",
  });
}