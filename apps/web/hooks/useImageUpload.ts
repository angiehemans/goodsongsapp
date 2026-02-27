'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { notifications } from '@mantine/notifications';

export interface ImageUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export interface ImageUploadState {
  file: File | null;
  previewUrl: string | null;
  isValidating: boolean;
}

export interface UseImageUploadReturn {
  file: File | null;
  previewUrl: string | null;
  isValidating: boolean;
  handleSelect: (file: File | null) => void;
  reset: () => void;
  resetRef: React.RefObject<(() => void) | null>;
}

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ALLOWED_TYPES = ['image/'];

/**
 * Hook for handling image file selection with validation
 *
 * @param options - Configuration options for validation
 * @returns Image upload state and handlers
 *
 * @example
 * ```tsx
 * const { file, previewUrl, handleSelect, reset, resetRef } = useImageUpload();
 *
 * <FileButton onChange={handleSelect} resetRef={resetRef} accept="image/*">
 *   {(props) => <Button {...props}>Upload Image</Button>}
 * </FileButton>
 *
 * {previewUrl && <Image src={previewUrl} alt="Preview" />}
 * ```
 */
export function useImageUpload(options: ImageUploadOptions = {}): UseImageUploadReturn {
  const { maxSizeMB = DEFAULT_MAX_SIZE_MB, allowedTypes = DEFAULT_ALLOWED_TYPES } = options;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const resetRef = useRef<(() => void) | null>(null);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) {
        return;
      }

      setIsValidating(true);

      // Validate file type
      const isValidType = allowedTypes.some((type) =>
        type.endsWith('/') ? selectedFile.type.startsWith(type) : selectedFile.type === type
      );

      if (!isValidType) {
        notifications.show({
          title: 'Invalid file type',
          message: 'Please select an image file',
          color: 'red',
        });
        setIsValidating(false);
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (selectedFile.size > maxSizeBytes) {
        notifications.show({
          title: 'File too large',
          message: `Please select an image smaller than ${maxSizeMB}MB`,
          color: 'red',
        });
        setIsValidating(false);
        return;
      }

      // Clean up previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setIsValidating(false);
    },
    [allowedTypes, maxSizeMB, previewUrl]
  );

  const reset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    resetRef.current?.();
  }, [previewUrl]);

  return {
    file,
    previewUrl,
    isValidating,
    handleSelect,
    reset,
    resetRef,
  };
}
