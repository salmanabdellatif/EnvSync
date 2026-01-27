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

interface ResetPasswordProps {
  resetUrl: string;
}

export default function ResetPasswordEmail({ resetUrl }: ResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your EnvSync password</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                background: '#09090b',
                border: '#27272a',
                text: '#fafafa',
                muted: '#a1a1aa',
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
                Reset your password
              </Heading>

              <Text className="text-muted text-[14px] leading-[24px]">
                We received a request to reset the password for your EnvSync
                account. If this was you, you can set a new password here:
              </Text>

              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-white rounded text-black text-[12px] font-semibold no-underline text-center px-6 py-3"
                  href={resetUrl}
                >
                  Reset Password
                </Button>
              </Section>

              <Text className="text-muted text-[14px] leading-[24px]">
                or copy and paste this link: <br />
                <Link
                  href={resetUrl}
                  className="text-blue-500 no-underline break-all"
                >
                  {resetUrl}
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
