'use client';

import Link from 'next/link';
import { IconHome, IconMusic } from '@tabler/icons-react';
import { Box, Container, Flex, Grid, Stack, Text, Title } from '@mantine/core';
import styles from './page.module.css';

export default function PrivacyPolicyPage() {
  return (
    <Box className={styles.page}>
      {/* Fixed Navigation */}
      <Box component="nav" className={styles.navbar}>
        <Container size="xl">
          <Flex justify="space-between" align="center" h={60}>
            <Link href="/" className={styles.logo}>
              <IconMusic size={24} />
              <Text fw={700} size="lg">
                goodsongs
              </Text>
            </Link>
            <Link href="/" className={styles.logo}>
              <IconHome size={20} />
              <Text size="sm">Home</Text>
            </Link>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box className={styles.hero}>
        <Container size="md">
          <Stack align="center" gap="md">
            <Title order={1} size="3rem" c="blue.9" ta="center">
              Privacy Policy
            </Title>
            <Text size="lg" c="grape.6" ta="center">
              Last Updated: February 10, 2026
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Content Section */}
      <Box className={styles.content} py={60}>
        <Container size="md">
          <Box className={styles.policyContent}>
            {/* Introduction */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Introduction
              </Title>
              <Text className={styles.paragraph}>
                GoodSongs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information when you use our website, mobile applications, and services (collectively, the &quot;Service&quot;).
              </Text>
              <Text className={styles.paragraph}>
                By using GoodSongs, you agree to the collection and use of information in accordance with this policy.
              </Text>
            </section>

            {/* Information We Collect */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Information We Collect
              </Title>

              <Title order={3} className={styles.subsectionTitle}>
                Information You Provide
              </Title>
              <ul className={styles.list}>
                <li>
                  <strong>Account Information:</strong> When you create an account, we collect your email address, username, and password. You may also choose to provide a profile photo, bio, location, and links to your social media accounts.
                </li>
                <li>
                  <strong>Recommendations and Content:</strong> When you share song recommendations, comments, or other content, we store that information along with associated metadata like timestamps.
                </li>
                <li>
                  <strong>Communications:</strong> If you contact us for support or feedback, we may retain those communications.
                </li>
              </ul>

              <Title order={3} className={styles.subsectionTitle}>
                Information Collected Automatically
              </Title>
              <ul className={styles.list}>
                <li>
                  <strong>Listening History:</strong> If you enable scrobbling features, we collect information about the music you listen to, including track name, artist, album, timestamp, and the app used for playback. You can disable this feature at any time in your settings.
                </li>
                <li>
                  <strong>Usage Data:</strong> We collect information about how you interact with the Service, such as pages visited, features used, and actions taken.
                </li>
                <li>
                  <strong>Device Information:</strong> We may collect information about your device, including device type, operating system, unique device identifiers, and mobile network information.
                </li>
                <li>
                  <strong>Log Data:</strong> Our servers automatically record information when you access the Service, including your IP address, browser type, referring/exit pages, and timestamps.
                </li>
              </ul>

              <Title order={3} className={styles.subsectionTitle}>
                Information from Third Parties
              </Title>
              <ul className={styles.list}>
                <li>
                  <strong>Connected Services:</strong> If you connect third-party accounts (such as Last.fm or Apple Music), we receive information from those services in accordance with your privacy settings on those platforms. This may include your listening history and profile information.
                </li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                How We Use Your Information
              </Title>
              <Text className={styles.paragraph}>We use the information we collect to:</Text>
              <ul className={styles.list}>
                <li>Provide, maintain, and improve the Service</li>
                <li>Create and manage your account</li>
                <li>Display your recommendations to other users</li>
                <li>Personalize your experience and show relevant content</li>
                <li>Send you updates, security alerts, and support messages</li>
                <li>Analyze usage patterns to improve our features</li>
                <li>Detect, prevent, and address technical issues or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* How We Share Your Information */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                How We Share Your Information
              </Title>

              <Title order={3} className={styles.subsectionTitle}>
                Public Information
              </Title>
              <Text className={styles.paragraph}>
                Your username, profile photo, bio, and recommendations are public by default and visible to other users. You can adjust some privacy settings in your account.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                Service Providers
              </Title>
              <Text className={styles.paragraph}>
                We may share information with third-party vendors who help us operate the Service, such as hosting providers, analytics services, and email delivery services. These providers are obligated to protect your information and use it only for the purposes we specify.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                Legal Requirements
              </Title>
              <Text className={styles.paragraph}>
                We may disclose your information if required by law, legal process, or government request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                Business Transfers
              </Title>
              <Text className={styles.paragraph}>
                If GoodSongs is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                With Your Consent
              </Title>
              <Text className={styles.paragraph}>
                We may share your information in other ways if you give us explicit consent to do so.
              </Text>
            </section>

            {/* Third-Party Services */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Third-Party Services
              </Title>
              <Text className={styles.paragraph}>
                The Service may contain links to third-party websites or integrate with third-party services. This Privacy Policy does not apply to those third parties. We encourage you to review the privacy policies of any third-party services you use.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                Analytics
              </Title>
              <Text className={styles.paragraph}>
                We use analytics services to help us understand how users interact with the Service. These services may collect information about your use of the Service and other websites and apps.
              </Text>
            </section>

            {/* Data Retention */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Data Retention
              </Title>
              <Text className={styles.paragraph}>
                We retain your information for as long as your account is active or as needed to provide you the Service. If you delete your account, we will delete or anonymize your information within a reasonable timeframe, unless we are required to retain it for legal purposes.
              </Text>
            </section>

            {/* Your Rights and Choices */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Your Rights and Choices
              </Title>

              <Title order={3} className={styles.subsectionTitle}>
                Account Information
              </Title>
              <Text className={styles.paragraph}>
                You can access, update, or delete your account information at any time through your account settings. If you wish to delete your account entirely, you can do so in settings or by contacting us.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                Listening History
              </Title>
              <Text className={styles.paragraph}>
                You can disable scrobbling features at any time. You can also delete your listening history in your account settings.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                Connected Services
              </Title>
              <Text className={styles.paragraph}>
                You can disconnect third-party services at any time in your account settings.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                Communications
              </Title>
              <Text className={styles.paragraph}>
                You can opt out of promotional emails by following the unsubscribe instructions in those messages. You may still receive transactional emails related to your account.
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                Data Requests
              </Title>
              <Text className={styles.paragraph}>
                Depending on your location, you may have additional rights regarding your personal data, including the right to access, correct, delete, or port your data. To exercise these rights, please contact us at{' '}
                <a href="mailto:support@goodsongs.app" className={styles.link}>
                  support@goodsongs.app
                </a>
                .
              </Text>
            </section>

            {/* Data Security */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Data Security
              </Title>
              <Text className={styles.paragraph}>
                We implement reasonable technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
              </Text>
            </section>

            {/* Children's Privacy */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Children&apos;s Privacy
              </Title>
              <Text className={styles.paragraph}>
                GoodSongs is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13, we will take steps to delete that information promptly.
              </Text>
            </section>

            {/* International Data Transfers */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                International Data Transfers
              </Title>
              <Text className={styles.paragraph}>
                Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws. By using the Service, you consent to the transfer of your information to these countries.
              </Text>
            </section>

            {/* Changes to This Policy */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Changes to This Policy
              </Title>
              <Text className={styles.paragraph}>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Service or sending you an email. Your continued use of the Service after changes take effect constitutes your acceptance of the updated policy.
              </Text>
            </section>

            {/* Contact Us */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Contact Us
              </Title>
              <Text className={styles.paragraph}>
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </Text>
              <Text className={styles.paragraph}>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@goodsongs.app" className={styles.link}>
                  support@goodsongs.app
                </a>
              </Text>
              <Text className={styles.paragraph}>
                <strong>Company:</strong> goodsongs.app
              </Text>
            </section>

            {/* Additional Disclosures */}
            <section className={styles.section}>
              <Title order={2} className={styles.sectionTitle}>
                Additional Disclosures
              </Title>

              <Title order={3} className={styles.subsectionTitle}>
                For California Residents (CCPA)
              </Title>
              <Text className={styles.paragraph}>
                If you are a California resident, you have certain rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your personal information, and the right to opt out of the sale of your personal information. We do not sell personal information.
              </Text>
              <Text className={styles.paragraph}>
                To exercise your rights, please contact us at{' '}
                <a href="mailto:support@goodsongs.app" className={styles.link}>
                  support@goodsongs.app
                </a>
                .
              </Text>

              <Title order={3} className={styles.subsectionTitle}>
                For European Users (GDPR)
              </Title>
              <Text className={styles.paragraph}>
                If you are located in the European Economic Area (EEA), you have certain rights under the General Data Protection Regulation (GDPR), including:
              </Text>
              <ul className={styles.list}>
                <li>The right to access your personal data</li>
                <li>The right to rectify inaccurate personal data</li>
                <li>The right to erasure (&quot;right to be forgotten&quot;)</li>
                <li>The right to restrict processing</li>
                <li>The right to data portability</li>
                <li>The right to object to processing</li>
                <li>The right to withdraw consent</li>
              </ul>
              <Text className={styles.paragraph}>
                Our legal basis for processing your information includes your consent, the performance of our contract with you (providing the Service), and our legitimate interests in operating and improving the Service.
              </Text>
              <Text className={styles.paragraph}>
                To exercise your rights or if you have concerns about our data practices, please contact us at{' '}
                <a href="mailto:support@goodsongs.app" className={styles.link}>
                  support@goodsongs.app
                </a>
                . You also have the right to lodge a complaint with your local data protection authority.
              </Text>
            </section>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" className={styles.footer}>
        <Container size="lg">
          <Grid gutter="xl" py={60}>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Flex gap="sm" mb="md" align="center">
                <IconMusic size={28} color="var(--mantine-color-grape-0)" />
                <Text c="grape.0" fw={700} size="xl">
                  goodsongs
                </Text>
              </Flex>
              <Text c="blue.3" size="sm">
                Where bands and fans belong. Share the music you love, discover what&apos;s next.
              </Text>
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text c="grape.0" fw={600} mb="md">
                Quick Links
              </Text>
              <Stack gap="xs">
                <Link href="/" className={styles.footerLink}>
                  Home
                </Link>
                <Link href="/signup" className={styles.footerLink}>
                  Sign Up
                </Link>
                <Link href="/login" className={styles.footerLink}>
                  Log In
                </Link>
                <Link href="/discover" className={styles.footerLink}>
                  Discover
                </Link>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text c="grape.0" fw={600} mb="md">
                Legal
              </Text>
              <Stack gap="xs">
                <Link href="/about" className={styles.footerLink}>
                  About
                </Link>
                <Link href="/privacy" className={styles.footerLink}>
                  Privacy Policy
                </Link>
              </Stack>
            </Grid.Col>
          </Grid>

          <Box className={styles.footerBottom}>
            <Text c="blue.4" size="sm" ta="center">
              &copy; 2026 Goodsongs. Made for music lovers, by music lovers.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
