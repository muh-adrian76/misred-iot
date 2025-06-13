"use client";
import { Link } from "next-view-transitions";
import { motion, AnimatePresence } from "framer-motion";

export default function Page() {
  return (
    <AnimatePresence>
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center p-6">
        <motion.img
          key="401-image"
          src="/401.svg"
          alt="401 Unauthorized"
          className="w-72 h-auto mb-3"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <motion.div
          key="401-description"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: "easeInOut", delay: 1 }}
        >
          <h1 className="text-3xl font-bold text-primary mb-3">
            Akses ditolak!
          </h1>
          <p className="text-muted-foreground mb-6">
            Silahkan login terlebih dahulu untuk mengaksesnya.
          </p>
          <Link
            href="/auth"
            className="px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-all"
          >
            Kembali ke halaman login
          </Link>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
