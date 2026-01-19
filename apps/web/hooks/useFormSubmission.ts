'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showSuccessNotification, showErrorNotification } from '@/lib/notifications';

interface UseFormSubmissionOptions {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function useFormSubmission<T = any>(
  submitFn: (data: T) => Promise<any>,
  options: UseFormSubmissionOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    onSuccess,
    onError,
    redirectTo,
    successMessage = 'Operation completed successfully',
    errorMessage = 'An error occurred',
  } = options;

  const handleSubmit = async (data: T) => {
    setLoading(true);
    setError(null);

    try {
      const result = await submitFn(data);
      
      // Show success notification
      showSuccessNotification({ message: successMessage });

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Redirect if specified
      if (redirectTo) {
        router.push(redirectTo);
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage;
      setError(errorMsg);

      // Show error notification
      showErrorNotification({ message: errorMsg });

      // Call error callback
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMsg));
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSubmit,
    loading,
    error,
    clearError: () => setError(null),
  };
}