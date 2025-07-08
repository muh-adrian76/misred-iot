import { Resend } from "resend";
import EmailTemplate from "@/components/custom/other/email-template";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(req) {
  const { email, password } = await req.json();

  try {
    const { data, error } = await resend.emails.send({
      from: "MiSREd-IoT <support@misred-iot.com>",
      to: [email],
      subject: "Reset Password MiSREd-IoT",
      react: EmailTemplate({ email, password }),
    });

    if (error) {
      throw new Error(`Gagal mengirim email.`);
    }

    return Response.json({ success: true, result: "Email berhasil terkirim." }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
