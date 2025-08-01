// Komponen client-side untuk layout halaman 404 Not Found
"use client";

// Import komponen navigasi dengan view transitions
import { Link } from "next-view-transitions";

// Import Framer Motion untuk animasi dan transitions
import { motion, AnimatePresence } from "framer-motion";

// Import Head untuk preloading assets
import Head from "next/head";

/**
 * Komponen layout untuk halaman 404 Not Found
 * Menampilkan animasi dan pesan error dengan style yang menarik
 * @returns {JSX.Element} Layout halaman 404 dengan animasi
 */
export default function NotFoundLayout() {
  return (
    <>
      {/* Preload gambar 404 untuk performa yang lebih baik */}
      <Head>
        <link rel="preload" href="/404.svg" as="image" />
      </Head>
      
      {/* Container animasi dengan AnimatePresence untuk smooth transitions */}
      <AnimatePresence>
        {/* Gambar 404 dengan animasi scale dan opacity */}
        <motion.img
          key="404-image" // Key unik untuk animasi
          src="/404.svg" // Path ke gambar 404
          alt="404 Not Found" // Alt text untuk accessibility
          className="w-96 h-auto mb-10 mt-[-50px]" // Styling responsif
          // Konfigurasi animasi masuk
          initial={{ opacity: 0, scale: 0 }} // State awal: tidak terlihat dan kecil
          animate={{ opacity: 1, scale: 1 }} // State akhir: terlihat penuh dan ukuran normal
          exit={{ opacity: 0, scale: 0 }} // State keluar: fade out dan mengecil
          transition={{ duration: 1, ease: "easeInOut" }} // Durasi 1 detik dengan easing smooth
        />
        
        {/* Container untuk teks dan tombol dengan animasi slide up */}
        <motion.div
          key="404-description" // Key unik untuk animasi
          // Konfigurasi animasi masuk dari bawah
          initial={{ opacity: 0, y: 50 }} // State awal: tidak terlihat dan di bawah
          animate={{ opacity: 1, y: 0 }} // State akhir: terlihat dan posisi normal
          exit={{ opacity: 0, y: 50 }} // State keluar: fade out dan slide down
          transition={{ duration: 0.5, ease: "easeInOut", delay: 1 }} // Delay 1 detik setelah gambar
        >
          {/* Judul halaman 404 */}
          <h1 className="text-3xl font-bold text-primary mb-4">
            Halaman tidak ditemukan!
          </h1>
          
          {/* Pesan deskripsi dengan tone informal */}
          <p className="text-muted-foreground mb-6">Fix, anda nyasar!</p>
          
          {/* Tombol navigasi kembali ke dashboard dengan view transition */}
          <Link
            href="/dashboards" // Redirect ke halaman dashboard utama
            className="px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-all"
          >
            Kembali ke halaman utama
          </Link>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
