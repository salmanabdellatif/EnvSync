import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Link,
  Hr,
} from '@react-email/components';

interface VerifyEmailProps {
  verifyUrl: string;
}

export default function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your EnvSync email address</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                background: '#09090b', // zinc-950
                border: '#27272a', // zinc-800
                text: '#fafafa', // zinc-50
                muted: '#a1a1aa', // zinc-400
              },
            },
          },
        }}
      >
        <Body className="bg-background my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-border rounded-lg my-[40px] mx-auto p-[20px] max-w-[465px] bg-background">
            {/* Logo */}
            <Section className="mt-[20px] text-center">
              <Text className="text-white text-2xl font-bold tracking-tighter m-0">
                EnvSync
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="text-center mt-[32px] mb-[32px]">
              <Heading className="text-text text-[24px] font-medium text-center p-0 my-[30px] mx-0">
                Verify your email
              </Heading>

              <Text className="text-muted text-[14px] leading-[24px]">
                Welcome to EnvSync. Please verify your email address to activate
                your account and access your dashboard.
              </Text>

              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-white rounded text-black text-[12px] font-semibold no-underline text-center px-6 py-3"
                  href={verifyUrl}
                >
                  Verify Email
                </Button>
              </Section>

              <Text className="text-muted text-[14px] leading-[24px]">
                or copy and paste this link: <br />
                <Link
                  href={verifyUrl}
                  className="text-blue-500 no-underline break-all"
                >
                  {verifyUrl}
                </Link>
              </Text>
            </Section>

            <Hr className="border-border mx-0 w-full" />

            {/* Footer */}
            <Text className="text-muted text-[12px] leading-[24px] text-center mt-4">
              © {new Date().getFullYear()} EnvSync Inc. <br />
              Zero-knowledge infrastructure management.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
