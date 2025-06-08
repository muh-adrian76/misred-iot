"use client";
import { Link } from "next-view-transitions";
import { motion, AnimatePresence } from "framer-motion";

export default function NotFound() {
  return (
    <AnimatePresence>
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center p-6">
        <motion.img
          src="/404.svg"
          alt="404 Not Found"
          className="w-96 h-96"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: "easeInOut", delay: 1 }}
        >
          <h1 className="text-3xl font-bold text-primary mb-4">
            Halaman tidak ditemukan!
          </h1>
          <p className="text-muted-foreground mb-6">Fix, anda nyasar!</p>
          <Link
            href="/dashboards"
            className="px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-all"
          >
            Kembali ke halaman utama
          </Link>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
