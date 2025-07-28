"use client";

import React, { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Menu,
  X,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Activity,
  Shield,
  BarChart3,
  Zap,
  Globe,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  FileStack,
  BellRing,
} from "lucide-react";
import { Link } from "next-view-transitions";
import ThemeButton from "@/components/custom/buttons/theme-button";
import localFont from "next/font/local";

const logoFont = localFont({
  src: "../../public/logo-font.ttf",
});

const LandingPage = () => {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");
  const [isScrolled, setIsScrolled] = useState(false);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll and section detection
  useEffect(() => {
    const handleScroll = () => {
      // Cek jika scroll position > 50px
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Deteksi section yang aktif
      const sections = ["beranda", "tentang", "kontak"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = sectionId === "beranda" ? 0 : -20; // Sesuaikan offset
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 dark:text-white text-gray-900 transition-colors duration-300">
      {/* Navbar */}
      <nav className="dark:bg-gray-900 dark:border-gray-800 bg-white border-gray-200 border-b sticky top-0 z-50 transition-all duration-300 dark:shadow-lg dark:bg-opacity-95 dark:backdrop-blur-sm shadow-md bg-opacity-95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 rounded-md flex items-center justify-center mr-3">
                  <img src="web-logo.svg" alt="Logo" />
                </div>
                <span className={`text-xl font-bold ${logoFont.className}`}>
                  MiSREd IoT
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex space-x-8">
                <button
                  onClick={() => scrollToSection("beranda")}
                  className={`${activeSection === "beranda" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-400 dark:text-white dark:hover:text-red-400"} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  Beranda
                </button>
                <button
                  onClick={() => scrollToSection("tentang")}
                  className={`${activeSection === "tentang" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-400 dark:text-white dark:hover:text-red-400"} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  Tentang
                </button>
                <button
                  onClick={() => scrollToSection("kontak")}
                  className={`${activeSection === "kontak" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-400 dark:text-white dark:hover:text-red-400"} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  Kontak
                </button>
              </div>
            </div>

            {/* Right side - Dark Mode Toggle */}
            <div className="hidden md:flex items-center">
              <ThemeButton variant="ghost" />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2 ml-auto">
              <ThemeButton variant="ghost" />
              <button
                onClick={toggleMobileMenu}
                className="text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300 p-2 rounded-md transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 border-t">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button
                onClick={() => scrollToSection("beranda")}
                className={`${activeSection === "beranda" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-600 hover:bg-gray-50 dark:text-white dark:hover:text-red-400 dark:hover:bg-gray-800"} block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 w-full text-left`}
              >
                Beranda
              </button>
              <button
                onClick={() => scrollToSection("tentang")}
                className={`${activeSection === "tentang" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-600 hover:bg-gray-50 dark:text-white dark:hover:text-red-400 dark:hover:bg-gray-800"} block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 w-full text-left`}
              >
                Tentang
              </button>
              <button
                onClick={() => scrollToSection("kontak")}
                className={`${activeSection === "kontak" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-600 hover:bg-gray-50 dark:text-white dark:hover:text-red-400 dark:hover:bg-gray-800"} block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 w-full text-left`}
              >
                Kontak
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {/* Beranda Section */}
        <section
          id="beranda"
          className="scroll-mt-0 py-35 bg-[url('/bg-landing_compressed.webp')] bg-cover bg-center bg-no-repeat relative"
        >
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <div className="mb-8">
                {/* Animated Logo */}
                <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full mb-8 bg-white/5 backdrop-blur-sm shadow-2xl animate-pulse">
                  <img
                    src="misred-red.png"
                    alt="Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
                  />
                </div>

                {/* Hero Title with Better Typography */}
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--destructive)] bg-clip-text text-transparent">
                    MiSREd IoT
                  </span>
                  <br />
                  <span className="text-white drop-shadow-2xl">
                    Monitoring System
                  </span>
                </h1>

                {/* Enhanced Description */}
                <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
                  Solusi monitoring dan kontrol perangkat IoT terdepan untuk
                  bisnis modern. Pantau, analisis, dan kelola semua perangkat
                  IoT Anda dalam satu platform terintegrasi.
                </p>
              </div>

              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/auth"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--destructive)] text-[var(--primary-foreground)] px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:brightness-110"
                >
                  Mulai Sekarang
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform duration-300"
                  />
                </Link>
                <button
                  onClick={() => scrollToSection("tentang")}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm"
                >
                  Pelajari Lebih Lanjut
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tentang Section */}
        <section
          id="tentang"
          className="scroll-mt-16 py-20 bg-gray-50 dark:bg-gray-800"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Tentang MiSREd IoT
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Platform monitoring IoT yang dirancang khusus untuk memenuhi
                kebutuhan bisnis modern dengan teknologi terdepan
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* Card 1 - Multi-Protocol Support */}
              <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FileStack size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-green-500 transition-colors duration-300">
                  Multi-Protocol Support
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                  Dukungan multi-protokol untuk integrasi perangkat IoT yang
                  fleksibel dan mudah dikonfigurasi.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    HTTP
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    MQTT
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    WebSocket
                  </span>
                </div>
              </div>

              {/* Card 2 - Real-time Notification */}
              <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BellRing size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-red-500 transition-colors duration-300">
                  Real-time Notification
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                  Sistem notifikasi real-time untuk alert monitoring perangkat
                  IoT dengan berbagai channel komunikasi.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    In-App Notification
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    WhatsApp
                  </span>
                </div>
              </div>

              {/* Card 3 - JWT Powered Security */}
              <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-500 transition-colors duration-300">
                  JWT Powered Security
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                  Proteksi data dengan autentikasi JWT yang aman, dilengkapi
                  enkripsi end-to-end dan sistem monitoring real-time.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    JWT Auth
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    End-to-End Encryption
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Access Control
                  </span>
                </div>
              </div>

              {/* Card 4 - Real-time Processing */}
              <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Zap size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-teal-500 transition-colors duration-300">
                  Real-time Processing
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                  Pemrosesan data real-time dengan performa tinggi untuk respons
                  yang cepat dan akurat dalam skala enterprise.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                    Real-time Analytics
                  </span>
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
                    High Performance
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Scalable
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Features Section */}
            <div className="mt-20 text-center">
              <h3 className="text-2xl sm:text-3xl font-bold mb-12">
                Mengapa Memilih MiSREd IoT?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Globe size={24} className="text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Akses Global</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitoring dari mana saja
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users size={24} className="text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">User-Friendly</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mudah digunakan
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Analytics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Laporan detail & insights
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Award size={24} className="text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Reliable</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Uptime 99.9% guaranteed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kontak Section */}
        <section id="kontak" className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Hubungi Kami
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Siap membantu Anda mengimplementasikan solusi IoT monitoring
                yang tepat untuk bisnis Anda
              </p>
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Phone */}
              <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-green-300 dark:border-gray-700 dark:hover:border-green-500/50">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Phone size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-green-500 transition-colors duration-300">
                  Telepon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Hubungi kami langsung untuk konsultasi
                </p>
                <a
                  href="tel:+6281234567890"
                  className="inline-flex items-center gap-2 text-green-500 hover:text-green-600 font-semibold text-lg transition-colors duration-300"
                >
                  +62 812-3456-7890
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform duration-300"
                  />
                </a>
              </div>

              {/* Email */}
              <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-500/50">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Mail size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-blue-500 transition-colors duration-300">
                  Email
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Kirim pertanyaan detail via email
                </p>
                <a
                  href="mailto:misrediot@gmail.com"
                  className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold text-lg transition-colors duration-300"
                >
                  misrediot@gmail.com
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform duration-300"
                  />
                </a>
              </div>

              {/* Social Media */}
              <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-purple-300 dark:border-gray-700 dark:hover:border-purple-500/50">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Instagram size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-purple-500 transition-colors duration-300">
                  Media Sosial
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Ikuti update terbaru kami
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                  >
                    <Instagram size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-400 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                  >
                    <Twitter size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                  >
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
            </div>

            {/* Enhanced Partner Card */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-8 lg:p-12 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                {/* Background Pattern for Partner Card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/10 to-orange-500/10 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                  <div className="w-32 h-32 lg:w-40 lg:h-40 flex-shrink-0 flex items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
                    <img
                      src="logo-polines.webp"
                      alt="Logo Polines"
                      className="max-w-full max-h-full"
                    />
                  </div>
                  <div className="text-center lg:text-left flex-1">
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                      <Award size={24} className="text-blue-500" />
                      <h3 className="text-2xl lg:text-3xl font-bold">
                        Mitra Resmi
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                      Kolaborasi dengan{" "}
                      <span className="font-semibold text-blue-500">
                        Politeknik Negeri Semarang
                      </span>{" "}
                      untuk pengembangan solusi IoT terbaik yang inovatif dan
                      terpercaya
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <a
                        href="mailto:sekretariat@polines.ac.id"
                        className="flex items-center justify-center lg:justify-start gap-3 text-blue-500 hover:text-blue-600 font-semibold text-lg transition-colors duration-300 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Mail size={20} />
                        sekretariat@polines.ac.id
                      </a>
                      <a
                        href="tel:+62247473417"
                        className="flex items-center justify-center lg:justify-start gap-3 text-blue-500 hover:text-blue-600 font-semibold text-lg transition-colors duration-300 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Phone size={20} />
                        (024) 7473417
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-md flex items-center justify-center mr-3">
                <img src="web-logo.svg" alt="Logo" />
              </div>
              <span className="text-xl font-bold">MiSREd IoT</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gedung MST Polines - Jl.Prof. Soedarto, Tembalang, Semarang, Jawa
              Tengah 50275
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              © 2025 MiSREd IoT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
