import { Resend } from "resend";
import EmailTemplate from "@/components/custom/other/email-template";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(req) {
  const { email, password, otp, type = "reset-password" } = await req.json();

  const emailConfig = {
    "reset-password": {
      subject: "Reset Password MiSREd-IoT",
      template: { type: "reset-password", email, password }
    },
    "otp-verification": {
      subject: "Kode Verifikasi Akun MiSREd-IoT",
      template: { type: "otp-verification", email, otp }
    }
  };

  const config = emailConfig[type] || emailConfig["reset-password"];

  try {
    const { data, error } = await resend.emails.send({
      from: "MiSREd-IoT <support@misred-iot.com>",
      to: [email],
      subject: config.subject,
      react: EmailTemplate(config.template),
    });

    if (error) {
      throw new Error(`Gagal mengirim email.`);
    }

    return Response.json({ success: true, result: "Email berhasil terkirim." }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
