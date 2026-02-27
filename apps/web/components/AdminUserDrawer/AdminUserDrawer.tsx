'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconCamera,
  IconExternalLink,
  IconMusic,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Drawer,
  FileButton,
  Group,
  Loader,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import {
  AdminPlan,
  AdminUserDetail,
  AdminUserUpdateData,
  apiClient,
  Band,
  Review,
  Role,
  User,
} from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';

interface AdminUserDrawerProps {
  userId: number | null;
  opened: boolean;
  onClose: () => void;
  onUserUpdated?: (user: User) => void;
  onDeleteClick?: (userId: number, displayName: string) => void;
  currentUserId?: number;
}

export function AdminUserDrawer({
  userId,
  opened,
  onClose,
  onUserUpdated,
  onDeleteClick,
  currentUserId,
}: AdminUserDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('details');

  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [admin, setAdmin] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [role, setRole] = useState<string>('fan');
  const [planId, setPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [lastfmUsername, setLastfmUsername] = useState('');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resetRef = useRef<() => void>(null);

  const fetchUserDetail = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch user details and plans in parallel
      const [data, plansData] = await Promise.all([
        apiClient.getAdminUserDetail(userId),
        apiClient.getAdminPlans(),
      ]);
      setUserDetail(data.user);
      setReviews(data.reviews || []);
      setBands(data.bands || []);
      setPlans(plansData.plans || []);

      // Initialize form state
      setEmail(data.user.email || '');
      setUsername(data.user.username || '');
      setAboutMe(data.user.about_me || '');
      setCity(data.user.city || '');
      setRegion(data.user.region || '');
      setAdmin(data.user.admin || false);
      setDisabled(data.user.disabled || false);
      // Normalize role: prefer role field, fall back to account_type
      const rawRole = data.user.role ?? data.user.account_type;
      let normalizedRole = 'fan';
      if (rawRole === 'fan' || rawRole === 0) normalizedRole = 'fan';
      else if (rawRole === 'band' || rawRole === 1) normalizedRole = 'band';
      else if (rawRole === 'blogger' || rawRole === 'music_blogger' || rawRole === 3) normalizedRole = 'blogger';
      setRole(normalizedRole);
      // Set plan ID based on user's current plan
      const userPlanKey = data.user.plan?.key;
      const matchingPlan = plansData.plans?.find((p) => p.key === userPlanKey);
      setPlanId(matchingPlan ? String(matchingPlan.id) : null);
      setLastfmUsername(data.user.lastfm_username || '');
      setOnboardingCompleted(data.user.onboarding_completed || false);
      const imageUrl = fixImageUrl(data.user.profile_image_url);
      setPreviewUrl(imageUrl !== undefined ? imageUrl : null);
      setProfileImage(null);
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load user details.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (opened && userId) {
      setActiveTab('details');
      fetchUserDetail();
    }
  }, [opened, userId, fetchUserDetail]);

  const handleImageSelect = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        notifications.show({
          title: 'Invalid file type',
          message: 'Please select an image file',
          color: 'red',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        notifications.show({
          title: 'File too large',
          message: 'Please select an image smaller than 5MB',
          color: 'red',
        });
        return;
      }
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    const originalUrl = userDetail?.profile_image_url ? fixImageUrl(userDetail.profile_image_url) : undefined;
    setPreviewUrl(originalUrl !== undefined ? originalUrl : null);
    resetRef.current?.();
  };

  const handleSave = async () => {
    if (!userId || !userDetail) return;

    setSaving(true);
    try {
      // Always send all fields so empty values clear the field in the API
      const updateData: AdminUserUpdateData = {
        email,
        username: username || undefined, // username can be null for band accounts
        about_me: aboutMe,
        city,
        region,
        disabled,
        role: role as Role,
        plan_id: planId ? parseInt(planId, 10) : undefined,
        lastfm_username: lastfmUsername, // send empty string to clear
        onboarding_completed: onboardingCompleted,
      };

      // Only include admin field if we're not editing ourselves
      if (currentUserId !== userId) {
        updateData.admin = admin;
      }

      if (profileImage) {
        updateData.profile_image = profileImage;
      }

      const response = await apiClient.updateAdminUser(userId, updateData);

      notifications.show({
        title: 'Success',
        message: response.message || 'User updated successfully.',
        color: 'green',
      });

      setUserDetail(response.user);
      setProfileImage(null);

      // Notify parent to update the list
      if (onUserUpdated) {
        onUserUpdated(response.user);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update user.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!userId || !userDetail) return;
    const displayName = userDetail.username || userDetail.email;
    onDeleteClick?.(userId, displayName);
  };

  const isCurrentUser = currentUserId === userId;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <span>User Details</span>
          {userDetail?.admin && (
            <Badge color="red" size="sm">
              Admin
            </Badge>
          )}
          {userDetail?.disabled && (
            <Badge color="gray" size="sm">
              Disabled
            </Badge>
          )}
        </Group>
      }
      position="right"
      size="lg"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
    >
      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : !userDetail ? (
        <Center py="xl">
          <Text c="dimmed">User not found</Text>
        </Center>
      ) : (
        <Stack gap="md">
          {/* User Header */}
          <Group>
            <Box pos="relative">
              <Avatar
                size="xl"
                src={previewUrl}
                color="grape"
              >
                {username?.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}
              </Avatar>
              <FileButton
                resetRef={resetRef}
                onChange={handleImageSelect}
                accept="image/png,image/jpeg,image/jpg,image/webp"
              >
                {(props) => (
                  <ActionIcon
                    {...props}
                    variant="filled"
                    color="grape"
                    size="sm"
                    radius="xl"
                    pos="absolute"
                    bottom={0}
                    right={0}
                  >
                    <IconCamera size={14} />
                  </ActionIcon>
                )}
              </FileButton>
            </Box>
            <Stack gap={4} style={{ flex: 1 }}>
              <Title order={4}>{username || 'No username'}</Title>
              <Text size="sm" c="dimmed">
                {email}
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="grape" size="sm">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="light" color="blue" size="sm">
                  {bands.length} band{bands.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
            </Stack>
            {username && (
              <Button
                component={Link}
                href={role === 'blogger' ? `/blogs/${username}` : `/users/${username}`}
                target="_blank"
                variant="light"
                size="xs"
                rightSection={<IconExternalLink size={14} />}
              >
                View Profile
              </Button>
            )}
          </Group>

          {profileImage && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                New image selected:
              </Text>
              <Text size="sm" fw={500}>
                {profileImage.name}
              </Text>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xs"
                onClick={handleRemoveImage}
              >
                <IconX size={12} />
              </ActionIcon>
            </Group>
          )}

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="details">Details</Tabs.Tab>
              <Tabs.Tab value="reviews">Reviews ({reviews.length})</Tabs.Tab>
              <Tabs.Tab value="bands">Bands ({bands.length})</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="details" pt="md">
              <ScrollArea h="calc(100vh - 380px)" offsetScrollbars>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <TextInput
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />

                  <Textarea
                    label="About"
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    placeholder="User bio..."
                    minRows={3}
                    maxLength={500}
                  />

                  <Group grow>
                    <TextInput
                      label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                    <TextInput
                      label="Region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="State / Region"
                    />
                  </Group>

                  <Select
                    label="Role"
                    value={role}
                    onChange={(value) => setRole(value || 'fan')}
                    data={[
                      { value: 'fan', label: 'Fan' },
                      { value: 'band', label: 'Band' },
                      { value: 'blogger', label: 'Blogger' },
                    ]}
                  />

                  <Select
                    label="Plan"
                    placeholder="Select a plan"
                    value={planId}
                    onChange={setPlanId}
                    data={plans.map((plan) => ({
                      value: String(plan.id),
                      label: `${plan.name} (${plan.role})`,
                    }))}
                    clearable
                  />

                  <TextInput
                    label="Last.fm Username"
                    value={lastfmUsername}
                    onChange={(e) => setLastfmUsername(e.target.value)}
                    placeholder="Last.fm username"
                  />

                  <Switch
                    label="Onboarding Completed"
                    checked={onboardingCompleted}
                    onChange={(e) => setOnboardingCompleted(e.currentTarget.checked)}
                  />

                  {!isCurrentUser && (
                    <>
                      <Switch
                        label="Admin"
                        description="Grant admin privileges to this user"
                        checked={admin}
                        onChange={(e) => setAdmin(e.currentTarget.checked)}
                        color="red"
                      />

                      <Switch
                        label="Disabled"
                        description="Disabled users cannot login"
                        checked={disabled}
                        onChange={(e) => setDisabled(e.currentTarget.checked)}
                        color="red"
                      />
                    </>
                  )}

                  <Text size="xs" c="dimmed">
                    Created: {new Date(userDetail.created_at).toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Updated: {new Date(userDetail.updated_at).toLocaleString()}
                  </Text>
                </Stack>
              </ScrollArea>
            </Tabs.Panel>

            <Tabs.Panel value="reviews" pt="md">
              <ScrollArea h="calc(100vh - 380px)" offsetScrollbars>
                {reviews.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="md">
                      <IconMusic size={48} color="var(--mantine-color-gray-5)" />
                      <Text c="dimmed" ta="center">
                        No reviews yet.
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Tabs.Panel>

            <Tabs.Panel value="bands" pt="md">
              <ScrollArea h="calc(100vh - 380px)" offsetScrollbars>
                {bands.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="md">
                      <IconMusic size={48} color="var(--mantine-color-gray-5)" />
                      <Text c="dimmed" ta="center">
                        No bands yet.
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {bands.map((band) => (
                      <Group
                        key={band.id}
                        p="sm"
                        style={{
                          border: '1px solid var(--mantine-color-gray-3)',
                          borderRadius: 'var(--mantine-radius-md)',
                        }}
                      >
                        <Avatar
                          size="md"
                          src={fixImageUrl(band.profile_picture_url)}
                          color="grape"
                        >
                          {band.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Text fw={500}>{band.name}</Text>
                          <Text size="sm" c="dimmed">
                            {band.location || 'No location'}
                          </Text>
                        </Stack>
                        <Button
                          component={Link}
                          href={`/bands/${band.slug}`}
                          target="_blank"
                          variant="light"
                          size="xs"
                          rightSection={<IconExternalLink size={14} />}
                        >
                          View
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>

          {/* Actions */}
          <Group justify="space-between" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            {!isCurrentUser && !userDetail.admin && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDelete}
              >
                Delete User
              </Button>
            )}
            <Group gap="sm" ml="auto">
              <Button variant="light" color="gray" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Drawer>
  );
}
