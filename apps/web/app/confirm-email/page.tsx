'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Button, Center, Loader, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link. No token provided.');
      return;
    }

    // Prevent double execution in React Strict Mode
    if (hasAttempted.current) {
      return;
    }
    hasAttempted.current = true;

    const confirmEmail = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been confirmed!');

          // Store the new auth token if returned
          if (data.auth_token) {
            localStorage.setItem('authToken', data.auth_token);
            // Refresh user data to update email_confirmed status
            await refreshUser();
          }

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/user/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to confirm email.');
        }
      } catch {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    confirmEmail();
  }, [token, router, refreshUser]);

  return (
    <Center mih="100vh" style={{ backgroundColor: 'var(--gs-bg-accent)' }}>
      <Paper p="xl" radius="md" withBorder shadow="md" w={400}>
        <Stack align="center" gap="md">
          {status === 'loading' && (
            <>
              <Loader size="lg" color="grape" />
              <Title order={2} ta="center" style={{ color: 'var(--gs-text-primary)' }}>
                Confirming your email...
              </Title>
              <Text c="dimmed" ta="center">
                Please wait
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <ThemeIcon size={60} radius="xl" color="green">
                <IconCheck size={32} />
              </ThemeIcon>
              <Title order={2} ta="center" c="green.7">
                Email Confirmed!
              </Title>
              <Text ta="center">{message}</Text>
              <Text size="sm" c="dimmed" ta="center">
                Redirecting to dashboard...
              </Text>
            </>
          )}

          {status === 'error' && (
            <>
              <ThemeIcon size={60} radius="xl" color="red">
                <IconX size={32} />
              </ThemeIcon>
              <Title order={2} ta="center" c="red.7">
                Confirmation Failed
              </Title>
              <Text ta="center" c="dimmed">
                {message}
              </Text>
              <Button
                variant="light"
                color="grape"
                onClick={() => router.push('/login')}
                fullWidth
                mt="md"
              >
                Go to Login
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <Center mih="100vh" style={{ backgroundColor: 'var(--gs-bg-accent)' }}>
          <Loader size="lg" color="grape" />
        </Center>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
