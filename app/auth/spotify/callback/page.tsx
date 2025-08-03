'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Alert, Text, Loader, Center } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

function SpotifyCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(error === 'access_denied' 
        ? 'Spotify access was denied. You can try connecting again later.' 
        : `Spotify OAuth error: ${error}`
      );
      // Redirect back to dashboard after showing error
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 3000);
      return;
    }

    if (code) {
      setStatus('success');
      setMessage('Successfully connected to Spotify! Redirecting to dashboard...');
      // Redirect back to dashboard after successful connection
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 2000);
      return;
    }

    // If no code or error, something went wrong
    setStatus('error');
    setMessage('Invalid callback parameters');
    setTimeout(() => {
      router.push('/user/dashboard');
    }, 3000);
  }, [searchParams]);

  return (
    <Container size="sm" py="xl">
      <Center>
        {status === 'loading' && (
          <Alert icon={<Loader size="1rem" />} title="Processing" color="blue">
            <Text>Processing Spotify connection...</Text>
          </Alert>
        )}
        
        {status === 'success' && (
          <Alert icon={<IconCheck size="1rem" />} title="Success!" color="green">
            <Text>{message}</Text>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert icon={<IconX size="1rem" />} title="Error" color="red">
            <Text>{message}</Text>
          </Alert>
        )}
      </Center>
    </Container>
  );
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense fallback={
      <Container size="sm" py="xl">
        <Center>
          <Alert icon={<Loader size="1rem" />} title="Loading" color="blue">
            <Text>Loading...</Text>
          </Alert>
        </Center>
      </Container>
    }>
      <SpotifyCallbackContent />
    </Suspense>
  );
}