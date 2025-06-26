import {
  Body,
  Button,
  Column,
  Container,
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
  const previewText = `Reset password berhasil. ${email}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Section className="mt-8">
              <Img
                src={"/web-logo.svg"}
                width="80"
                height="80"
                alt="Misred-IoT Logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              Reset password berhasil!
            </Heading>
            <Text className="text-sm">Halo {email},</Text>
            <Text className="text-sm">
              Terimakasih sudah menggunakan aplikasi<strong>Misred-IoT</strong>.
              Berikut adalah password Anda. Segera login dan lakukan reset password pada menu profil aplikasi.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
             {password}
            </Section>
            <Text className="text-sm">
              Terima Kasih,
              <br />
              <strong>Misred-IoT</strong> Platform
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailTemplate;
