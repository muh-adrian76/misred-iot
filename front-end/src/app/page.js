// Komponen client-side untuk landing page utama aplikasi
"use client";

// Import React hooks
import React, { useState, useEffect } from "react";

// Import icons dari Lucide React untuk UI elements
import {
  Moon, // Icon untuk dark mode
  Sun, // Icon untuk light mode
  Menu, // Icon untuk mobile menu
  X, // Icon untuk close button
  Phone, // Icon untuk contact phone
  Mail, // Icon untuk contact email
  Facebook, // Icon untuk social media
  Instagram, // Icon untuk social media
  Twitter, // Icon untuk social media
  Linkedin, // Icon untuk social media
  Activity, // Icon untuk activity/monitoring
  Shield, // Icon untuk security/reliability
  BarChart3, // Icon untuk analytics/charts
  Zap, // Icon untuk performance/speed
  Globe, // Icon untuk global/scalability
  Users, // Icon untuk multi-user
  Award, // Icon untuk awards/achievement
  ArrowRight, // Icon untuk checkmarks/success
  MousePointerClick, // Icon untuk navigation
  Mouse,
  FileStack, // Icon untuk documentation/files
  BellRing, // Icon untuk notifications/alarms
} from "lucide-react";

// Import Next.js components
import { Link } from "next-view-transitions"; // Standard Next.js Link
import ThemeButton from "@/components/custom/buttons/theme-button"; // Custom theme toggle button
import localFont from "next/font/local"; // Font loader untuk custom fonts

// Konfigurasi font lokal untuk logo dan branding
const logoFont = localFont({
  src: "../../public/logo-font.ttf", // Path ke file font TTF logo
});

/**
 * Komponen utama Landing Page untuk aplikasi MiSREd-IoT
 * Menampilkan hero section, features, contact, dan informasi produk
 * @returns {JSX.Element}
 */
export default function LandingPage() {
  // State untuk hydration check (mencegah hydration mismatch)
  const [mounted, setMounted] = useState(false);
  
  // State untuk kontrol mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Ensure proper hydration in Chrome
  useEffect(() => {
    document.documentElement.style.visibility = 'visible';
  }, []);
  
  // State untuk tracking section yang aktif saat scroll
  const [activeSection, setActiveSection] = useState("beranda");
  
  // State untuk efek scroll pada navbar
  const [isScrolled, setIsScrolled] = useState(false);

  // Effect untuk memastikan komponen sudah mounted (mencegah hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect untuk handle scroll dan deteksi section yang aktif
  useEffect(() => {
    /**
     * Handler untuk event scroll window
     * Mengatur efek scroll pada navbar dan deteksi section aktif
     */
    const handleScroll = () => {
      // Cek jika scroll position > 50px untuk efek navbar
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Deteksi section yang aktif berdasarkan posisi scroll
      const sections = ["beranda", "tentang", "kontak"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Set section sebagai aktif jika berada di viewport center
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    // Tambahkan event listener untuk scroll
    window.addEventListener("scroll", handleScroll);
    
    // Cleanup event listener saat komponen unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent hydration mismatch dengan return null jika belum mounted
  if (!mounted) {
    return null;
  }

  /**
   * Fungsi untuk smooth scroll ke section tertentu
   * @param {string} sectionId - ID section yang akan di-scroll
   */
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId); // Set section sebagai aktif
    const element = document.getElementById(sectionId);
    
    if (element) {
      // Sesuaikan offset berdasarkan section
      const yOffset = sectionId === "beranda" ? 0 : -20;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      // Smooth scroll ke posisi target
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    
    // Tutup mobile menu setelah navigasi
    setIsMobileMenuOpen(false);
  };

  /**
   * Toggle state mobile menu (buka/tutup)
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }} />;
  }

  return (
    <>
      {/* Container utama dengan full screen height dan theme transitions */}
      <div className="min-h-screen bg-white dark:bg-gray-900 dark:text-white text-gray-900 transition-colors duration-300">
        
        {/* Navigation Bar - Sticky dengan backdrop blur effect */}
        <nav className="dark:bg-gray-900 dark:border-gray-800 bg-white border-gray-200 border-b sticky top-0 z-50 transition-all duration-300 dark:shadow-lg dark:bg-opacity-95 dark:backdrop-blur-sm shadow-md bg-opacity-95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              
              {/* Logo Section */}
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  {/* Logo Icon */}
                  <div className="w-8 h-8 rounded-md flex items-center justify-center mr-3">
                    <img src="/web-logo.svg" alt="Logo" />
                  </div>
                  {/* Brand Text dengan custom font */}
                  <span className={`text-xl font-bold ${logoFont.className}`}>
                    MiSREd IoT
                  </span>
                </div>
              </div>

              {/* Desktop Navigation Menu - Hidden pada mobile */}
              <div className="hidden md:flex flex-1 justify-center">
                <div className="flex space-x-8">
                  {/* Navigation Button - Beranda */}
                  <button
                    onClick={() => scrollToSection("beranda")}
                    className={`${activeSection === "beranda" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-400 dark:text-white dark:hover:text-red-400"} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Beranda
                  </button>
                  
                  {/* Navigation Button - Tentang */}
                  <button
                    onClick={() => scrollToSection("tentang")}
                    className={`${activeSection === "tentang" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-400 dark:text-white dark:hover:text-red-400"} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Tentang
                  </button>
                  
                  {/* Navigation Button - Kontak */}
                  <button
                    onClick={() => scrollToSection("kontak")}
                    className={`${activeSection === "kontak" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-400 dark:text-white dark:hover:text-red-400"} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Kontak
                  </button>
                </div>
              </div>

              {/* Right side - Theme Toggle untuk Desktop */}
              <div className="hidden md:flex items-center">
                <ThemeButton variant="ghost" />
              </div>

              {/* Mobile menu controls - Theme toggle dan hamburger menu */}
              <div className="md:hidden flex items-center gap-2 ml-auto">
                <ThemeButton variant="ghost" />
                {/* Mobile menu toggle button */}
                <button
                  onClick={toggleMobileMenu}
                  className="text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300 p-2 rounded-md transition-colors duration-200"
                  aria-label="Toggle mobile menu"
                >
                  {/* Icon berubah berdasarkan state menu */}
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu - Conditional rendering */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 border-t">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {/* Mobile Navigation Button - Beranda */}
                <button
                  onClick={() => scrollToSection("beranda")}
                  className={`${activeSection === "beranda" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-600 hover:bg-gray-50 dark:text-white dark:hover:text-red-400 dark:hover:bg-gray-800"} block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 w-full text-left`}
                >
                  Beranda
                </button>
                
                {/* Mobile Navigation Button - Tentang */}
                <button
                  onClick={() => scrollToSection("tentang")}
                  className={`${activeSection === "tentang" ? "text-[color:var(--primary)]" : "text-gray-900 hover:text-red-600 hover:bg-gray-50 dark:text-white dark:hover:text-red-400 dark:hover:bg-gray-800"} block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 w-full text-left`}
                >
                  Tentang
                </button>
                
                {/* Mobile Navigation Button - Kontak */}
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

        {/* Main Content - Konten utama landing page */}
        <main>
          
          {/* Hero Section - Beranda dengan background image */}
          <section
            id="beranda"
            className="scroll-mt-0 py-35 bg-[url('/bg-landing_compressed.webp')] bg-cover bg-center bg-no-repeat relative"
          >
            {/* Overlay untuk background blur dan darkening */}
            <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>
            
            {/* Content container dengan z-index tinggi */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center">
                <div className="mb-8">
                  
                  {/* Animated Logo dengan pulse effect */}
                  <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full mb-8 bg-white/5 backdrop-blur-sm shadow-2xl animate-pulse">
                    <img
                      src="/misred-red.png"
                      alt="Logo"
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
                    />
                  </div>

                  {/* Hero Title dengan gradient text dan typography yang menarik */}
                  <h1 className="text-4xl md:text-6xl font-bold mb-6">
                    {/* Brand name dengan gradient effect */}
                    <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--destructive)] bg-clip-text text-transparent">
                      MiSREd IoT
                    </span>
                    <br />
                    {/* Subtitle dengan drop shadow */}
                    <span className="text-white drop-shadow-2xl">
                      Monitoring System
                    </span>
                  </h1>

                  {/* Enhanced Description - Value proposition */}
                  <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
                    Solusi pemantauan perangkat IoT terdepan untuk
                    bisnis modern. Pantau, analisis, dan kelola semua perangkat
                    IoT Anda dalam satu platform terintegrasi.
                  </p>
                </div>

                {/* Call-to-Action Buttons dengan enhanced styling */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {/* Primary CTA - Link ke halaman auth */}
                  <Link
                    href="/auth"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--destructive)] text-[var(--primary-foreground)] px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:brightness-110"
                  >
                    Mulai Sekarang
                    {/* Arrow icon dengan hover animation */}
                    <MousePointerClick
                      size={20}
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </Link>
                  
                  {/* Secondary CTA - Scroll ke section tentang */}
                  <button
                    onClick={() => scrollToSection("tentang")}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm"
                  >
                    Pelajari Lebih Lanjut
                    <Mouse className="group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* About Section - Tentang MiSREd IoT */}
          <section
            id="tentang"
            className="scroll-mt-16 py-20 bg-gray-50 dark:bg-gray-800"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Tentang MiSREd IoT
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Platform monitoring IoT yang dirancang khusus untuk memenuhi
                  kebutuhan bisnis modern dengan teknologi terdepan
                </p>
              </div>

              {/* Feature Cards Grid - 4 kartu fitur utama */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                
                {/* Feature Card 1 - Multi-Protocol Support */}
                <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600">
                  {/* Icon dengan gradient background dan hover animation */}
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <FileStack size={28} className="text-white" />
                  </div>
                  
                  {/* Card Title dengan hover color change */}
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-green-500 transition-colors duration-300">
                    Multi-Protocol Support
                  </h3>
                  
                  {/* Card Description */}
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                    Dukungan multi-protokol untuk integrasi perangkat IoT yang
                    fleksibel dan mudah dikonfigurasi.
                  </p>
                  
                  {/* Technology Tags */}
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

                {/* Feature Card 2 - Real-time Notification */}
                <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600">
                  {/* Icon dengan gradient background */}
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
                  
                  {/* Communication Channels */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      In-App Notification
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      WhatsApp
                    </span>
                  </div>
                </div>

                {/* Feature Card 3 - JWT Powered Security */}
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
                  
                  {/* Security Features */}
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

                {/* Feature Card 4 - Real-time Processing */}
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
                  
                  {/* Performance Features */}
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

              {/* Additional Benefits Section */}
              <div className="mt-20 text-center">
                <h3 className="text-2xl sm:text-3xl font-bold mb-12">
                  Mengapa Memilih MiSREd IoT?
                </h3>
                
                {/* Benefits Grid - 4 keunggulan utama */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  
                  {/* Benefit 1 - Global Access */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Globe size={24} className="text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">Akses Global</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Monitoring dari mana saja
                    </p>
                  </div>
                  
                  {/* Benefit 2 - User Friendly */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Users size={24} className="text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">User-Friendly</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mudah digunakan
                    </p>
                  </div>
                  
                  {/* Benefit 3 - Analytics */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <BarChart3 size={24} className="text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">Analytics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Laporan detail & insights
                    </p>
                  </div>
                  
                  {/* Benefit 4 - Reliability */}
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

          {/* Contact Section - Kontak dan informasi */}
          <section id="kontak" className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Hubungi Kami
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Siap membantu Anda mengimplementasikan solusi IoT monitoring
                  yang tepat untuk bisnis Anda
                </p>
              </div>

              {/* Contact Methods - 3 cara kontak utama */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                
                {/* Contact Card 1 - Phone */}
                <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-green-300 dark:border-gray-700 dark:hover:border-green-500/50">
                  {/* Phone Icon dengan gradient background */}
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Phone size={28} className="text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 group-hover:text-green-500 transition-colors duration-300">
                    Telepon
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Hubungi kami langsung untuk konsultasi
                  </p>
                  
                  {/* Phone Link dengan hover animation */}
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

                {/* Contact Card 2 - Email */}
                <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-500/50">
                  {/* Email Icon dengan gradient background */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Mail size={28} className="text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 group-hover:text-blue-500 transition-colors duration-300">
                    Email
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Kirim pertanyaan detail via email
                  </p>
                  
                  {/* Email Link */}
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

                {/* Contact Card 3 - Social Media */}
                <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 hover:border-purple-300 dark:border-gray-700 dark:hover:border-purple-500/50">
                  {/* Social Media Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Instagram size={28} className="text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 group-hover:text-purple-500 transition-colors duration-300">
                    Media Sosial
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Ikuti update terbaru kami
                  </p>
                  
                  {/* Social Media Links */}
                  <div className="flex justify-center space-x-4">
                    {/* Facebook Link */}
                    <a
                      href="#"
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                    >
                      <Facebook size={20} />
                    </a>
                    
                    {/* Instagram Link */}
                    <a
                      href="#"
                      className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                    >
                      <Instagram size={20} />
                    </a>
                    
                    {/* Twitter Link */}
                    <a
                      href="#"
                      className="w-10 h-10 bg-blue-400 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                    >
                      <Twitter size={20} />
                    </a>
                    
                    {/* LinkedIn Link */}
                    <a
                      href="#"
                      className="w-10 h-10 bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                    >
                      <Linkedin size={20} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Partnership Card - Enhanced card untuk mitra Polines */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-8 lg:p-12 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                  
                  {/* Background Pattern untuk visual appeal */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/10 to-orange-500/10 rounded-full translate-y-12 -translate-x-12"></div>

                  <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                    {/* Partner Logo */}
                    <div className="w-32 h-32 lg:w-40 lg:h-40 flex-shrink-0 flex items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
                      <img
                        src="/logo-polines.webp"
                        alt="Logo Polines"
                        className="max-w-full max-h-full"
                      />
                    </div>
                    
                    {/* Partner Information */}
                    <div className="text-center lg:text-left flex-1">
                      {/* Partnership Header */}
                      <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                        <Award size={24} className="text-blue-500" />
                        <h3 className="text-2xl lg:text-3xl font-bold">
                          Mitra Resmi
                        </h3>
                      </div>
                      
                      {/* Partnership Description */}
                      <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                        Kolaborasi dengan{" "}
                        <span className="font-semibold text-blue-500">
                          Politeknik Negeri Semarang
                        </span>{" "}
                        untuk pengembangan solusi IoT terbaik yang inovatif dan
                        terpercaya
                      </p>
                      
                      {/* Partner Contact Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Partner Email */}
                        <a
                          href="mailto:sekretariat@polines.ac.id"
                          className="flex items-center justify-center lg:justify-start gap-3 text-blue-500 hover:text-blue-600 font-semibold text-lg transition-colors duration-300 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Mail size={20} />
                          sekretariat@polines.ac.id
                        </a>
                        
                        {/* Partner Phone */}
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

        {/* Footer - Informasi penutup dan copyright */}
        <footer className="bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 border-t py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              
              {/* Footer Logo dan Brand */}
              <div className="flex items-center justify-center mb-4">
                {/* Footer Logo */}
                <div className="w-8 h-8 rounded-md flex items-center justify-center mr-3">
                  <img src="/web-logo.svg" alt="Logo" />
                </div>
                {/* Footer Brand Name */}
                <span className="text-xl font-bold">MiSREd IoT</span>
              </div>
              
              {/* Address Information */}
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Gedung MST Polines - Jl.Prof. Soedarto, Tembalang, Semarang, Jawa
                Tengah 50275
              </p>
              
              {/* Copyright Notice */}
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                © 2025 MiSREd IoT. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};