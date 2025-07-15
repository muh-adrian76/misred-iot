"use client";
import { Link } from "next-view-transitions";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";

export default function NotFoundLayout() {
  return (
    <>
      <Head>
        <link rel="preload" href="/404.svg" as="image" />
      </Head>
      <AnimatePresence>
        <motion.img
          key="404-image"
          src="/404.svg"
          alt="404 Not Found"
          className="w-96 h-auto mb-10 mt-[-50px]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        <motion.div
          key="404-description"
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
      </AnimatePresence>
    </>
  );
}
