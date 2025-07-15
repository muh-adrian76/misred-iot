'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X, Phone, Mail, Facebook, Instagram, Twitter, Linkedin, Activity, Shield, BarChart3, Zap, Globe, Users, Award, CheckCircle, ArrowRight, FileStack, BellRing } from 'lucide-react';
import { Link } from 'next-view-transitions';
import localFont from "next/font/local";

const logoFont = localFont({
  src: "../../public/logo-font.ttf",
});

const LandingPage = () => {
  const [isDark, setIsDark] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  // Tambahkan state untuk scroll
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Cek jika scroll position > 50px
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Deteksi section yang aktif
      const sections = ['beranda', 'tentang', 'kontak'];
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = sectionId === 'beranda' ? 0 : -20; // Sesuaikan offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const theme = isDark ? 'dark' : 'light';
  const bgClass = isDark ? 'bg-gray-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-white';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      {/* Navbar */}
      <nav className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-all duration-300 ${isScrolled ? (isDark ? 'shadow-lg bg-opacity-95 backdrop-blur-sm' : 'shadow-md bg-opacity-95 backdrop-blur-sm') : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 rounded-md flex items-center justify-center mr-3">
                  <img src="web-logo.svg" alt="Logo" />
                </div>
                <span className={`text-xl font-bold ${logoFont.className}`}>MiSREd IoT</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex space-x-8">
                <button 
                  onClick={() => scrollToSection('beranda')}
                  className={`${activeSection === 'beranda' ? 'text-[color:var(--primary)]' : isDark ? 'text-white hover:text-red-400' : 'text-gray-900 hover:text-red-400'} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  Beranda
                </button>
                <button 
                  onClick={() => scrollToSection('tentang')}
                  className={`${activeSection === 'tentang' ? 'text-[color:var(--primary)]' : isDark ? 'text-white hover:text-red-400' : 'text-gray-900 hover:text-red-400'} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  Tentang
                </button>
                <button 
                  onClick={() => scrollToSection('kontak')}
                  className={`${activeSection === 'kontak' ? 'text-[color:var(--primary)]' : isDark ? 'text-white hover:text-red-400' : 'text-gray-900 hover:text-red-400'} px-3 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  Kontak
                </button>
              </div>
            </div>

            {/* Right side - Dark Mode Toggle */}
            <div className="hidden md:flex items-center">
              <button
                onClick={toggleDarkMode}
                className={`${isDark ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'} p-2 rounded-md transition-colors duration-200`}
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2 ml-auto">
              <button
                onClick={toggleDarkMode}
                className={`${isDark ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'} p-2 rounded-md transition-colors duration-200`}
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={toggleMobileMenu}
                className={`${isDark ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'} p-2 rounded-md transition-colors duration-200`}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t`}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button 
                onClick={() => scrollToSection('beranda')}
                className={`${activeSection === 'beranda' ? 'text-[color:var(--primary)]' : isDark ? 'text-white hover:text-red-400 hover:bg-gray-800' : 'text-gray-900 hover:text-red-600 hover:bg-gray-50'} block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 w-full text-left`}
              >
                Beranda
              </button>
              <button 
                onClick={() => scrollToSection('tentang')}
                className={`${activeSection === 'tentang' ? 'text-[color:var(--primary)]' : isDark ? 'text-white hover:text-red-400 hover:bg-gray-800' : 'text-gray-900 hover:text-red-600 hover:bg-gray-50'} block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 w-full text-left`}
              >
                Tentang
              </button>
              <button 
                onClick={() => scrollToSection('kontak')}
                className={`${activeSection === 'kontak' ? 'text-[color:var(--primary)]' : isDark ? 'text-white hover:text-red-400 hover:bg-gray-800' : 'text-gray-900 hover:text-red-600 hover:bg-gray-50'} block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 w-full text-left`}
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
        <section id="beranda" className="scroll-mt-0 py-35 bg-[url('/bg-landing.webp')] bg-cover bg-center bg-no-repeat relative">
        <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20  rounded-full mb-6">
                  <img src="misred-red.png" alt="Logo" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--destructive)] bg-clip-text text-transparent">
                    MiSREd IoT
                  </span>
                  <br />
                  <span className="text-white">Monitoring System</span>
                </h1>
                <p className={`text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto`}>
                  Solusi monitoring dan kontrol perangkat IoT terdepan untuk bisnis modern. 
                  Pantau, analisis, dan kelola semua perangkat IoT Anda dalam satu platform terintegrasi.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex justify-center">
                <Link 
                  href="/auth"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--destructive)] text-[var(--primary-foreground)] px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:brightness-110"
                >
                  Mulai Sekarang <ArrowRight size={20} className="inline-block" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Tentang Section */}
        <section id="tentang" className={`scroll-mt-16 py-20 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Tentang MiSREd IoT</h2>
              <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                Platform monitoring IoT yang dirancang khusus untuk memenuhi kebutuhan bisnis modern
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {/* Card 1 - Multi-Protocol Support */}
              <div className={`${cardBgClass} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <FileStack size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Multi-Protocol Support</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  Dukungan multi-protokol (HTTP, MQTT, LoRaWAN) untuk integrasi perangkat IoT yang fleksibel.
                </p>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm"></span>
                </div>
              </div>

              {/* Card 2 - Real-time Notification */}
              <div className={`${cardBgClass} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <BellRing size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-time Notification</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  Sistem notifikasi real-time untuk alert monitoring perangkat IoT.
                </p>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm"></span>
                </div>
              </div>

              {/* Card 3 - JWT Powered Security */}
              <div className={`${cardBgClass} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">JWT Powered Security</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  Proteksi data dengan autentikasi JWT yang aman, dilengkapi enkripsi end-to-end dan sistem monitoring real-time.
                </p>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm"></span>
                </div>
              </div>

              {/* Card 4 - Real-time Processing */}
              <div className={`${cardBgClass} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                  <Zap size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-time Processing</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  Pemrosesan data real-time untuk respons yang cepat dan akurat.
                </p>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm"></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kontak Section */}
        <section id="kontak" className={`py-20 ${bgClass}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Hubungi Kami</h2>
              <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                Siap membantu Anda mengimplementasikan solusi IoT monitoring yang tepat untuk bisnis Anda
              </p>
            </div>

            {/* Tiga Card Pertama */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Phone */}
              <div className={`${cardBgClass} p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300`}>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Telepon</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3`}>
                  Hubungi kami langsung
                </p>
                <a href="tel:+6281234567890" className="text-blue-500 hover:text-blue-600 font-medium">
                  +62 812-3456-7890
                </a>
              </div>

              {/* Email */}
              <div className={`${cardBgClass} p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300`}>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3`}>
                  Kirim email kepada kami
                </p>
                <a href="mailto:info@iotmonitor.com" className="text-blue-500 hover:text-blue-600 font-medium">
                  misrediot@gmail.com
                </a>
              </div>

              {/* Social Media */}
              <div className={`${cardBgClass} p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300`}>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Facebook size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Media Sosial</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3`}>
                  Ikuti kami di media sosial
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-blue-500 hover:text-blue-600">
                    <Facebook size={20} />
                  </a>
                  <a href="#" className="text-pink-500 hover:text-pink-600">
                    <Instagram size={20} />
                  </a>
                  <a href="#" className="text-blue-400 hover:text-blue-500">
                    <Twitter size={20} />
                  </a>
                  <a href="#" className="text-blue-700 hover:text-blue-800">
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
            </div>

            {/* Card Support yang Diperbesar */}
            <div className="max-w-2xl mx-auto"> {/* Container untuk membatasi lebar */}
              <div className={`${cardBgClass} p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
                    <img src="logo-polines.webp" alt="Logo Polines" className="max-w-full max-h-full" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold mb-3">Mitra Resmi</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      Kolaborasi dengan Politeknik Negeri Semarang untuk pengembangan solusi IoT terbaik
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <a href="mailto:sekretariat@polines.ac.id" className="text-blue-500 hover:text-blue-600 font-medium">
                        sekretariat@polines.ac.id
                      </a>
                      <a href="tel:+62247473417" className="text-blue-500 hover:text-blue-600 font-medium">
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
      <footer className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-t py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-md flex items-center justify-center mr-3">
                <img src="web-logo.svg" alt="Logo" />
              </div>
              <span className="text-xl font-bold">MiSREd IoT</span>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Gedung MST Polines - Jl.Prof. Soedarto, Tembalang, Semarang, Jawa Tengah 50275
            </p>
            <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-sm`}>
              © 2025 MiSREd IoT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;