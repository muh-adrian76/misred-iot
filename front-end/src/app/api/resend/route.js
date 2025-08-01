// Import Resend service untuk email delivery
import { Resend } from "resend";

// Import template komponen untuk email formatting
import EmailTemplate from "@/components/custom/other/email-template";

// Inisialisasi Resend client dengan API key dari environment variable
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

/**
 * API Route handler untuk mengirim email menggunakan Resend service
 * Mendukung berbagai tipe email: reset password dan OTP verification
 * @param {Request} req - Request object dari Next.js
 * @returns {Response} JSON response dengan status success/error
 */
export async function POST(req) {
  // Destructure data dari request body dengan default type
  const { email, password, otp, type = "reset-password" } = await req.json();

  // Konfigurasi email berdasarkan tipe yang diminta
  const emailConfig = {
    "reset-password": {
      subject: "Reset Password MiSREd-IoT", // Subject untuk email reset password
      template: { type: "reset-password", email, password } // Data untuk template reset
    },
    "otp-verification": {
      subject: "Kode Verifikasi Akun MiSREd-IoT", // Subject untuk email OTP
      template: { type: "otp-verification", email, otp } // Data untuk template OTP
    }
  };

  // Ambil konfigurasi berdasarkan type, fallback ke reset-password
  const config = emailConfig[type] || emailConfig["reset-password"];

  // Try-catch block untuk error handling saat mengirim email
  try {
    // Kirim email menggunakan Resend API
    const { data, error } = await resend.emails.send({
      from: "MiSREd-IoT <support@misred-iot.com>", // Sender email address dengan display name
      to: [email], // Recipient email address dalam array format
      subject: config.subject, // Subject sesuai konfigurasi tipe email
      react: EmailTemplate(config.template), // React component sebagai email body
    });

    // Check jika ada error dari Resend service
    if (error) {
      throw new Error(`Gagal mengirim email.`);
    }

    // Return success response dengan status 200
    return Response.json({ success: true, result: "Email berhasil terkirim." }, { status: 200 });
  } catch (error) {
    // Return error response dengan pesan error dan status 500
    return Response.json({ error: error.message }, { status: 500 });
  }
}
