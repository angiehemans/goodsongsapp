'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Container,

  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconLock } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login, user, isLoading, isOnboardingComplete, isBand } = useAuth();
  const router = useRouter();

  // Redirect based on auth and onboarding status
  useEffect(() => {
    if (!isLoading && user) {
      if (!isOnboardingComplete) {
        router.push('/onboarding');
      } else if (isBand) {
        router.push('/user/band-dashboard');
      } else {
        router.push('/user/dashboard');
      }
    }
  }, [user, isLoading, isOnboardingComplete, isBand, router]);

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      notifications.show({
        title: 'Success',
        message: 'Welcome back!',
        color: 'green',
      });
      // Redirect will be handled by useEffect based on user's onboarding status
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Login failed',
        color: 'red',
      });
      setLoading(false);
    }
  };

  return (
    <Container size={400} my={40}>

        <Stack>
          <Title ta="center" c="goodsongs.6">
            Welcome to Goodsongs
          </Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Don&apos;t have an account yet?{' '}
            <Anchor size="sm" component={Link} href="/signup">
              Create account
            </Anchor>
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

                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  leftSection={<IconLock size={16} />}
                  required
                  {...form.getInputProps('password')}
                />

                <Anchor component={Link} href="/forgot-password" size="sm" ta="right">
                  Forgot password?
                </Anchor>

                <Button 
                  fullWidth 
                  mt="xl" 
                  loading={loading}
                  type="submit"
                  color="grape.9"
                >
                  Sign in
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>

    </Container>
  );
}
