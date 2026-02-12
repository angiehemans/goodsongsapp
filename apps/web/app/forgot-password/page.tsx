'use client';

import { useState } from 'react';
import {
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Anchor,
  Container,
  Stack,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconCheck, IconArrowLeft } from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface ForgotPasswordFormValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      await apiClient.forgotPassword(values.email);
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Container size={400} my={40}>
        <Stack>
          <Title ta="center" c="goodsongs.6">
            Check Your Email
          </Title>

          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <Stack align="center" gap="md">
              <Alert
                icon={<IconCheck size={16} />}
                color="green"
                variant="light"
                w="100%"
              >
                If an account exists with this email, a password reset link has been sent.
              </Alert>

              <Text size="sm" c="dimmed" ta="center">
                Please check your inbox and spam folder. The link will expire in 2 hours.
              </Text>

              <Anchor component={Link} href="/login" size="sm">
                <IconArrowLeft size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Back to login
              </Anchor>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size={400} my={40}>
      <Stack>
        <Title ta="center" c="goodsongs.6">
          Forgot Password
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Enter your email and we&apos;ll send you a reset link
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Email"
                placeholder="your@email.com"
                leftSection={<IconMail size={16} />}
                required
                {...form.getInputProps('email')}
              />

              <Button
                fullWidth
                mt="xl"
                loading={loading}
                type="submit"
                color="grape.9"
              >
                Send Reset Link
              </Button>

              <Text ta="center" size="sm">
                <Anchor component={Link} href="/login" size="sm">
                  <IconArrowLeft size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Back to login
                </Anchor>
              </Text>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
