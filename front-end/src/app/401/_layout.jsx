// Komponen client-side untuk layout halaman 401 Unauthorized
"use client";

// Import komponen navigasi dengan view transitions
import { Link } from "next-view-transitions";

// Import Framer Motion untuk animasi dan transitions
import { motion, AnimatePresence } from "framer-motion";

/**
 * Komponen layout untuk halaman 401 Unauthorized
 * Menampilkan animasi dan pesan error dengan call-to-action ke halaman login
 * @returns {JSX.Element} Layout halaman 401 dengan animasi dan tombol navigasi
 */
export default function UnauthorizedLayout() {
  return (
    // Container animasi dengan AnimatePresence untuk smooth transitions
    <AnimatePresence>
      {/* Gambar 401 dengan animasi scale dan opacity */}
      <motion.img
        key="401-image" // Key unik untuk animasi
        src="/401.svg" // Path ke gambar 401
        alt="401 Unauthorized" // Alt text untuk accessibility
        className="w-72 h-auto mb-3 mt-[-50px]" // Styling responsif dengan margin negatif
        initial={{ opacity: 0, scale: 0 }} // State awal: tidak terlihat dan kecil
        animate={{ opacity: 1, scale: 1 }} // State akhir: terlihat penuh dan ukuran normal
        exit={{ opacity: 0, scale: 0 }} // State keluar: fade out dan mengecil
        transition={{ duration: 0.5, ease: "easeInOut" }} // Durasi 0.5 detik dengan easing smooth
      />
      
      {/* Container untuk teks dan tombol dengan animasi slide up */}
      <motion.div
        key="401-description" // Key unik untuk animasi
        initial={{ opacity: 0, y: 50 }} // State awal: tidak terlihat dan di bawah
        animate={{ opacity: 1, y: 0 }} // State akhir: terlihat dan posisi normal
        exit={{ opacity: 0, y: 50 }} // State keluar: fade out dan slide down
        transition={{ duration: 0.5, ease: "easeInOut", delay: 1 }} // Delay 1 detik setelah gambar
      >
        {/* Judul halaman 401 */}
        <h1 className="text-3xl font-bold text-primary mb-3">Akses ditolak!</h1>
        
        {/* Pesan deskripsi dengan instruksi untuk user */}
        <p className="text-muted-foreground mb-6">
          Silahkan login terlebih dahulu untuk mengaksesnya.
        </p>
        
        {/* Tombol navigasi ke halaman login dengan view transition */}
        <Link
          href="/auth" // Redirect ke halaman authentication
          className="px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-all"
        >
          Kembali ke halaman login
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
