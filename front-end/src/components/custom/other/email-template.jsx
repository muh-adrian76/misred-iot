// Import komponen React Email untuk membuat template email yang responsif
import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

/**
 * Komponen EmailTemplate
 * 
 * Template email universal untuk aplikasi MiSREd-IoT yang mendukung berbagai
 * jenis email seperti reset password dan verifikasi OTP. Template ini
 * menggunakan React Email untuk memastikan kompatibilitas dengan semua
 * klien email dan tampilan yang konsisten.
 * 
 * @param {string} type - Jenis email ("reset-password" atau "otp-verification")
 * @param {string} email - Alamat email atau nama pengguna
 * @param {string} password - Password baru untuk reset password
 * @param {string} otp - Kode OTP untuk verifikasi
 */
const EmailTemplate = ({ 
  type = "reset-password", 
  email = "User", 
  password = "***", 
  otp = "000000" 
}) => {
  // Konfigurasi konten email berdasarkan tipe email yang dikirim
  // Setiap tipe memiliki struktur dan pesan yang berbeda
  const emailConfig = {
    "reset-password": {
      previewText: `Reset Kata Sandi berhasil. ${email}!`,
      title: "Pemberitahuan Reset Kata Sandi",
      greeting: `Halo ${email},`,
      content: "Terimakasih sudah menggunakan aplikasi MiSREd-IoT. Berikut adalah kata sandi baru Anda. Mohon untuk segera login dan ganti kata sandi Anda pada menu profil.",
      code: password,
      codeLabel: "Kata Sandi Baru"
    },
    "otp-verification": {
      previewText: `Kode Verifikasi OTP untuk ${email}`,
      title: "Verifikasi Akun MiSREd-IoT",
      greeting: `Halo ${email},`,
      content: "Terima kasih telah mendaftar di MiSREd-IoT! Untuk mengaktifkan akun Anda, silakan masukkan kode verifikasi berikut:",
      code: otp,
      codeLabel: "Kode Verifikasi",
      footer: "Kode ini berlaku selama 10 menit. Jika Anda tidak merasa mendaftar, abaikan email ini."
    }
  };

  // Ambil konfigurasi berdasarkan tipe, fallback ke reset-password jika tidak ditemukan
  const config = emailConfig[type] || emailConfig["reset-password"];

  return (
    // Wrapper HTML untuk email dengan font dan styling yang konsisten
    <Html>
      <Head>
        {/* Definisi font utama dengan fallback untuk kompatibilitas email client */}
        <Font
          fontFamily="Helvetica"
          fallbackFontFamily="Verdana"
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      
      {/* Teks preview yang muncul di inbox sebelum email dibuka */}
      <Preview>{config.previewText}</Preview>
      
      {/* Wrapper Tailwind CSS untuk styling yang konsisten */}
      <Tailwind>
        {/* Body email dengan background putih dan font sans-serif */}
        <Body className="bg-white my-auto mx-auto font-sans">
          {/* Container utama dengan lebar tetap untuk desktop email clients */}
          <Container className="my-10 mx-auto p-5 w-[465px]">
            
            {/* Section logo perusahaan di header email */}
            <Section className="mt-8">
              <Img
                src={"https://www.misred-iot.com/misred-text-red.png"}
                width="80"
                height="80"
                alt="Misred-IoT Logo"
                className="my-0 mx-auto"
              />
            </Section>
            
            {/* Judul email yang menjelaskan tujuan email */}
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              {config.title}
            </Heading>
            
            {/* Garis pembatas setelah header */}
            <Hr className="border-t border-gray-300 my-4" />
            
            {/* Salam pembuka yang dipersonalisasi dengan nama/email pengguna */}
            <Text className="text-sm">{config.greeting}</Text>
            
            {/* Konten utama email dengan penjelasan tindakan yang diperlukan */}
            <Text className="text-sm text-pretty">
              {config.content}
            </Text>
            
            {/* Kode/password yang ditampilkan dengan styling yang menonjol */}
            {/* Background merah sesuai dengan branding MiSREd-IoT */}
            <Text className="text-center text-xl tracking-widest w-36 mt-[32px] mb-[32px] bg-[#fb2c36] text-white font-bold rounded-lg py-4 mx-auto">
              {config.code}
            </Text>
            
            {/* Footer tambahan untuk email verifikasi OTP (informasi kedaluwarsa) */}
            {config.footer && (
              <Text className="text-sm text-center text-[rgb(0,0,0,0.7)] mb-4">
                {config.footer}
              </Text>
            )}
            
            {/* Garis pembatas sebelum footer perusahaan */}
            <Hr className="border-t border-gray-300 my-4" />
            
            {/* Footer email dengan informasi perusahaan dan alamat lengkap */}
            <Text className="text-sm text-center text-[rgb(0,0,0,0.7)]">
              © 2025 | MiSREd-IoT, Gedung MST Polines - Jl.Prof. Soedarto,
              Tembalang, Semarang, Jawa Tengah 50275, Indonesia. |
              www.misred-iot.com
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailTemplate;
