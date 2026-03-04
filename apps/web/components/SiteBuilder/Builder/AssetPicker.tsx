'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  SimpleGrid,
  Image,
  Stack,
  Text,
  Group,
  Button,
  Loader,
  Center,
  Box,
  Progress,
  Alert,
  ActionIcon,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconPhoto, IconUpload, IconX, IconCheck, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getProfileAssets, uploadProfileAsset, deleteProfileAsset } from '@/lib/site-builder/api';
import { ProfileAsset } from '@/lib/site-builder/types';
import { IMAGE_UPLOAD } from '@/lib/site-builder/constants';

interface AssetPickerProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

// Extended asset type to support local previews
interface LocalAsset extends ProfileAsset {
  isLocal?: boolean;
  localUrl?: string;
}

export function AssetPicker({ opened, onClose, onSelect }: AssetPickerProps) {
  const [assets, setAssets] = useState<LocalAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<LocalAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localIdCounter = useRef(0);

  // Cleanup local URLs on unmount
  useEffect(() => {
    return () => {
      assets.forEach((asset) => {
        if (asset.localUrl) {
          URL.revokeObjectURL(asset.localUrl);
        }
      });
    };
  }, []);

  const loadAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getProfileAssets();
      setAssets(response.data);
    } catch (err) {
      // If API fails, just show empty state (allow local uploads)
      setAssets([]);
      console.error('Failed to load assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (opened) {
      loadAssets();
      setSelectedAsset(null);
    }
  }, [opened, loadAssets]);

  const handleUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Validate file size
    if (file.size > IMAGE_UPLOAD.maxSizeBytes) {
      notifications.show({
        title: 'File too large',
        message: `Maximum file size is ${IMAGE_UPLOAD.maxSizeMB}MB`,
        color: 'red',
      });
      return;
    }

    // Validate file type
    if (!IMAGE_UPLOAD.allowedTypes.includes(file.type)) {
      notifications.show({
        title: 'Invalid file type',
        message: 'Please upload a JPEG, PNG, or WebP image',
        color: 'red',
      });
      return;
    }

    // Create local preview URL immediately
    const localUrl = URL.createObjectURL(file);
    const localId = --localIdCounter.current; // Use negative IDs for local assets

    const localAsset: LocalAsset = {
      id: localId,
      url: localUrl,
      thumbnail_url: localUrl,
      purpose: 'background',
      file_type: file.type,
      file_size: file.size,
      created_at: new Date().toISOString(),
      isLocal: true,
      localUrl: localUrl,
    };

    // Add local preview immediately and select it
    setAssets((prev) => [localAsset, ...prev]);
    setSelectedAsset(localAsset);

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress (real progress would require XMLHttpRequest)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await uploadProfileAsset(file, 'background');
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Replace local asset with server asset
      setAssets((prev) =>
        prev.map((a) => (a.id === localId ? { ...response.data } : a))
      );
      setSelectedAsset(response.data);

      // Cleanup local URL
      URL.revokeObjectURL(localUrl);

      notifications.show({
        title: 'Upload complete',
        message: 'Image uploaded successfully',
        color: 'green',
      });
    } catch (err: any) {
      clearInterval(progressInterval);
      // Keep the local preview even if upload fails
      notifications.show({
        title: 'Upload failed',
        message: err.message || 'Failed to upload image. Using local preview.',
        color: 'yellow',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (asset: LocalAsset) => {
    // Handle local assets (not uploaded to server yet)
    if (asset.isLocal && asset.localUrl) {
      URL.revokeObjectURL(asset.localUrl);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null);
      }
      return;
    }

    try {
      await deleteProfileAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null);
      }
      notifications.show({
        title: 'Deleted',
        message: 'Asset deleted successfully',
        color: 'blue',
      });
    } catch (err) {
      notifications.show({
        title: 'Delete failed',
        message: 'Failed to delete asset',
        color: 'red',
      });
    }
  };

  const handleConfirm = () => {
    if (selectedAsset) {
      // Use localUrl for local assets, otherwise use the server URL
      onSelect(selectedAsset.localUrl || selectedAsset.url);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Select Background Image"
      size="lg"
      centered
    >
      <Stack gap="md">
        {/* Upload Zone */}
        <Dropzone
          onDrop={handleUpload}
          accept={IMAGE_MIME_TYPE}
          maxSize={IMAGE_UPLOAD.maxSizeBytes}
          disabled={isUploading}
          loading={isUploading}
        >
          <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload size={40} stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={40} stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto size={40} stroke={1.5} />
            </Dropzone.Idle>

            <div>
              <Text size="lg" inline>
                Drag image here or click to browse
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                JPEG, PNG, or WebP. Max {IMAGE_UPLOAD.maxSizeMB}MB. {IMAGE_UPLOAD.recommendedSize}
              </Text>
            </div>
          </Group>
        </Dropzone>

        {isUploading && (
          <Progress value={uploadProgress} size="sm" animated />
        )}

        {/* Asset Grid */}
        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : error ? (
          <Alert color="red">{error}</Alert>
        ) : assets.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No images uploaded yet</Text>
          </Center>
        ) : (
          <>
            <Text size="sm" c="dimmed">
              Your images ({assets.length}/{IMAGE_UPLOAD.maxAssets})
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {assets.map((asset) => (
                <Box
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="asset-picker-item"
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border:
                      selectedAsset?.id === asset.id
                        ? '3px solid var(--mantine-primary-color-filled)'
                        : '3px solid transparent',
                    position: 'relative',
                  }}
                >
                  <Image
                    src={asset.localUrl || asset.thumbnail_url || asset.url}
                    alt="Asset"
                    height={100}
                    fit="cover"
                  />
                  {selectedAsset?.id === asset.id && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'var(--mantine-primary-color-filled)',
                        borderRadius: '50%',
                        padding: 2,
                      }}
                    >
                      <IconCheck size={14} color="white" />
                    </Box>
                  )}
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="sm"
                    className="asset-picker-delete"
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset);
                    }}
                    title="Delete image"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                  {asset.isLocal && (
                    <Box
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      <Text size="xs" c="white">Local</Text>
                    </Box>
                  )}
                </Box>
              ))}
            </SimpleGrid>
            <style>{`
              .asset-picker-item:hover .asset-picker-delete {
                opacity: 1 !important;
              }
            `}</style>
          </>
        )}

        {/* Actions */}
        <Group justify="space-between">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selectedAsset} onClick={handleConfirm}>
            Use Selected Image
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
