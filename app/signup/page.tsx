'use client';

import { useState } from 'react';
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
  Center,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconLock, IconUser } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: '',
      username: '',
      password: '',
      passwordConfirmation: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      username: (value) => (value.length < 3 ? 'Username must be at least 3 characters' : null),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      passwordConfirmation: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await signup(values.email, values.username, values.password, values.passwordConfirmation);
      notifications.show({
        title: 'Success',
        message: 'Account created successfully!',
        color: 'green',
      });
      router.push('/user/dashboard');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Signup failed',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Center>
        <Stack>
          <Title ta="center" c="goodsongs.6">
            Join Goodsongs
          </Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Already have an account?{' '}
            <Anchor size="sm" component={Link} href="/login">
              Sign in
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

                <TextInput
                  label="Username"
                  placeholder="your_username"
                  leftSection={<IconUser size={16} />}
                  required
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  leftSection={<IconLock size={16} />}
                  required
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  leftSection={<IconLock size={16} />}
                  required
                  {...form.getInputProps('passwordConfirmation')}
                />

                <Button 
                  fullWidth 
                  variant="outline"
                  mt="xl" 
                  loading={loading}
                  type="submit"
                  color="goodsongs.6"
                >
                  Create account
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Center>
    </Container>
  );
}
