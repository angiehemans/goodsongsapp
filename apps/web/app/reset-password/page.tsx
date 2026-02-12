'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Paper,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Container,
  Stack,
  Alert,
  Center,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconLock, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface ResetPasswordFormValues {
  password: string;
  passwordConfirmation: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    initialValues: {
      password: '',
      passwordConfirmation: '',
    },
    validate: {
      password: (value) =>
        value.length < 6 ? 'Password must be at least 6 characters' : null,
      passwordConfirmation: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('No reset token provided');
        setValidating(false);
        return;
      }

      try {
        const response = await apiClient.validateResetToken(token);
        if (response.valid) {
          setTokenValid(true);
        } else {
          setTokenError(response.error || 'Invalid or expired token');
        }
      } catch {
        setTokenError('Unable to validate token');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await apiClient.resetPassword(
        token,
        values.password,
        values.passwordConfirmation
      );

      // Store the auth token
      apiClient.setAuthToken(response.auth_token);
      await refreshUser();

      notifications.show({
        title: 'Password Reset',
        message: 'Your password has been reset successfully!',
        color: 'green',
      });

      router.push('/user/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while validating token
  if (validating) {
    return (
      <Container size={400} my={40}>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <Container size={400} my={40}>
        <Stack>
          <Title ta="center" c="goodsongs.6">
            Reset Password
          </Title>

          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <Stack align="center" gap="md">
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                variant="light"
                w="100%"
              >
                {tokenError}
              </Alert>

              <Text size="sm" c="dimmed" ta="center">
                The password reset link may have expired or already been used. Please request a new one.
              </Text>

              <Stack gap="xs" align="center">
                <Anchor component={Link} href="/forgot-password" size="sm">
                  Request new reset link
                </Anchor>
                <Anchor component={Link} href="/login" size="sm" c="dimmed">
                  <IconArrowLeft size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Back to login
                </Anchor>
              </Stack>
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
          Reset Password
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Enter your new password below
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <PasswordInput
                label="New Password"
                placeholder="Your new password"
                leftSection={<IconLock size={16} />}
                required
                {...form.getInputProps('password')}
              />

              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm your new password"
                leftSection={<IconLock size={16} />}
                required
                {...form.getInputProps('passwordConfirmation')}
              />

              <Button
                fullWidth
                mt="xl"
                loading={loading}
                type="submit"
                color="grape.9"
              >
                Reset Password
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
