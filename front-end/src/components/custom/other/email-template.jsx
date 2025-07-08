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

const EmailTemplate = ({ email = "User", password = "***" }) => {
  const previewText = `Reset Kata Sandi berhasil. ${email}!`;

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Helvetica"
          fallbackFontFamily="Verdana"
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Section className="mt-8">
              <Img
                src={"https://www.misred-iot.com/misred-text-red.png"}
                width="80"
                height="80"
                alt="Misred-IoT Logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              Pemberitahuan Reset Kata Sandi
            </Heading>
            <Hr className="border-t border-gray-300 my-4" />
            <Text className="text-sm">Halo {email},</Text>
            <Text className="text-sm text-pretty">
              Terimakasih sudah menggunakan aplikasi <strong>MiSREd-IoT</strong>
              . Berikut adalah kata sandi baru Anda. Mohon untuk segera login dan
              ganti kata sandi Anda pada menu profil.
            </Text>
            <Text className="text-center text-xl tracking-widest w-36 mt-[32px] mb-[32px] bg-[#fb2c36] text-white font-bold rounded-lg py-4 mx-auto">
              {password}
            </Text>
            <Hr className="border-t border-gray-300 my-4" />
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
