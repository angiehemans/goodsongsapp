'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  IconCategory,
  IconCheck,
  IconCircleCheckFilled,
  IconCrown,
  IconEdit,
  IconMinus,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  Card,
  Center,
  Container,
  Drawer,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import {
  apiClient,
  AdminPlan,
  AdminPlanDetail,
  Ability,
  PlansCompareResponse,
  PlansCompareAbility,
  AbilityCreateData,
} from '@/lib/api';

export default function AdminPlansPage() {
  const { user, isAdmin } = useAuth();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [compareData, setCompareData] = useState<PlansCompareResponse | null>(null);
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('plans');

  // Plan detail drawer
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [selectedPlan, setSelectedPlan] = useState<AdminPlanDetail | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Edit plan modal
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlanDetail | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price_cents_monthly: 0,
    price_cents_annual: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  // Add ability to plan modal
  const [addAbilityModalOpened, { open: openAddAbilityModal, close: closeAddAbilityModal }] = useDisclosure(false);
  const [availableAbilities, setAvailableAbilities] = useState<Ability[]>([]);
  const [addingAbilityId, setAddingAbilityId] = useState<number | null>(null);
  const [removingAbilityId, setRemovingAbilityId] = useState<number | null>(null);

  // Ability management state
  const [categories, setCategories] = useState<string[]>([]);
  const [createAbilityModalOpened, { open: openCreateAbilityModal, close: closeCreateAbilityModal }] = useDisclosure(false);
  const [editAbilityModalOpened, { open: openEditAbilityModal, close: closeEditAbilityModal }] = useDisclosure(false);
  const [deleteAbilityModalOpened, { open: openDeleteAbilityModal, close: closeDeleteAbilityModal }] = useDisclosure(false);
  const [editingAbility, setEditingAbility] = useState<Ability | null>(null);
  const [deletingAbility, setDeletingAbility] = useState<Ability | null>(null);
  const [abilityForm, setAbilityForm] = useState<AbilityCreateData>({
    key: '',
    name: '',
    description: '',
    category: '',
  });
  const [savingAbility, setSavingAbility] = useState(false);
  const [deletingAbilityLoading, setDeletingAbilityLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    if (!user || !isAdmin) return;
    try {
      const data = await apiClient.getAdminPlans();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  }, [user, isAdmin]);

  const fetchCompareData = useCallback(async () => {
    if (!user || !isAdmin) return;
    try {
      const data = await apiClient.getAdminPlanCompare();
      setCompareData(data);
    } catch (error) {
      console.error('Failed to fetch compare data:', error);
    }
  }, [user, isAdmin]);

  const fetchAbilities = useCallback(async () => {
    if (!user || !isAdmin) return;
    try {
      const data = await apiClient.getAdminAbilities();
      // Handle both array and grouped responses
      if (Array.isArray(data.abilities)) {
        setAbilities(data.abilities);
      } else {
        // Flatten grouped abilities
        const flatAbilities = Object.values(data.abilities).flat();
        setAbilities(flatAbilities);
      }
    } catch (error) {
      console.error('Failed to fetch abilities:', error);
    }
  }, [user, isAdmin]);

  const fetchCategories = useCallback(async () => {
    if (!user || !isAdmin) return;
    try {
      const data = await apiClient.getAbilityCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [user, isAdmin]);

  const fetchAllData = useCallback(async () => {
    setDataLoading(true);
    await Promise.all([fetchPlans(), fetchCompareData(), fetchAbilities(), fetchCategories()]);
    setDataLoading(false);
  }, [fetchPlans, fetchCompareData, fetchAbilities, fetchCategories]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllData();
    }
  }, [user, isAdmin, fetchAllData]);

  const handlePlanClick = async (planId: number) => {
    setPlanLoading(true);
    openDrawer();
    try {
      const data = await apiClient.getAdminPlan(planId);
      setSelectedPlan(data.plan);
    } catch (error) {
      console.error('Failed to fetch plan details:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load plan details',
        color: 'red',
      });
      closeDrawer();
    }
    setPlanLoading(false);
  };

  const handleEditPlan = (plan: AdminPlanDetail) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      price_cents_monthly: plan.price_cents_monthly,
      price_cents_annual: plan.price_cents_annual,
      active: plan.active,
    });
    openEditModal();
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const response = await apiClient.updateAdminPlan(editingPlan.id, editForm);
      setSelectedPlan(response.plan);
      // Update plans list
      setPlans((prev) =>
        prev.map((p) =>
          p.id === editingPlan.id
            ? { ...p, ...editForm }
            : p
        )
      );
      notifications.show({
        title: 'Success',
        message: 'Plan updated successfully',
        color: 'green',
      });
      closeEditModal();
    } catch (error) {
      console.error('Failed to update plan:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update plan',
        color: 'red',
      });
    }
    setSaving(false);
  };

  const handleOpenAddAbility = () => {
    if (!selectedPlan) return;
    // Filter out abilities already on this plan
    const planAbilityKeys = new Set(selectedPlan.abilities.map((a) => a.key));
    const available = abilities.filter((a) => !planAbilityKeys.has(a.key));
    setAvailableAbilities(available);
    openAddAbilityModal();
  };

  const handleAddAbility = async (abilityId: number) => {
    if (!selectedPlan) return;
    setAddingAbilityId(abilityId);
    try {
      const response = await apiClient.addAbilityToPlan(selectedPlan.id, abilityId);
      setSelectedPlan(response.plan);
      // Update the available abilities list
      setAvailableAbilities((prev) => prev.filter((a) => a.id !== abilityId));
      // Update plans list count
      setPlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlan.id
            ? { ...p, abilities_count: response.plan.abilities.length }
            : p
        )
      );
      // Refresh compare data
      fetchCompareData();
      notifications.show({
        title: 'Success',
        message: 'Ability added to plan',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to add ability:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add ability',
        color: 'red',
      });
    }
    setAddingAbilityId(null);
  };

  const handleRemoveAbility = async (abilityId: number) => {
    if (!selectedPlan) return;
    setRemovingAbilityId(abilityId);
    try {
      const response = await apiClient.removeAbilityFromPlan(selectedPlan.id, abilityId);
      setSelectedPlan(response.plan);
      // Update plans list count
      setPlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlan.id
            ? { ...p, abilities_count: response.plan.abilities.length }
            : p
        )
      );
      // Refresh compare data
      fetchCompareData();
      notifications.show({
        title: 'Success',
        message: 'Ability removed from plan',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to remove ability:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to remove ability',
        color: 'red',
      });
    }
    setRemovingAbilityId(null);
  };

  // Ability management handlers
  const handleOpenCreateAbility = () => {
    setAbilityForm({
      key: '',
      name: '',
      description: '',
      category: categories[0] || '',
    });
    openCreateAbilityModal();
  };

  const handleCreateAbility = async () => {
    if (!abilityForm.key || !abilityForm.name || !abilityForm.category) {
      notifications.show({
        title: 'Validation Error',
        message: 'Key, name, and category are required',
        color: 'red',
      });
      return;
    }
    setSavingAbility(true);
    try {
      const response = await apiClient.createAbility(abilityForm);
      setAbilities((prev) => [...prev, response.ability]);
      notifications.show({
        title: 'Success',
        message: 'Ability created successfully',
        color: 'green',
      });
      closeCreateAbilityModal();
      // Refresh compare data
      fetchCompareData();
    } catch (error: any) {
      console.error('Failed to create ability:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create ability',
        color: 'red',
      });
    }
    setSavingAbility(false);
  };

  const handleOpenEditAbility = (ability: Ability) => {
    setEditingAbility(ability);
    setAbilityForm({
      key: ability.key,
      name: ability.name,
      description: ability.description || '',
      category: ability.category || '',
    });
    openEditAbilityModal();
  };

  const handleUpdateAbility = async () => {
    if (!editingAbility?.id) return;
    if (!abilityForm.name || !abilityForm.category) {
      notifications.show({
        title: 'Validation Error',
        message: 'Name and category are required',
        color: 'red',
      });
      return;
    }
    setSavingAbility(true);
    try {
      const response = await apiClient.updateAbility(editingAbility.id, {
        name: abilityForm.name,
        description: abilityForm.description,
        category: abilityForm.category,
      });
      setAbilities((prev) =>
        prev.map((a) => (a.id === editingAbility.id ? response.ability : a))
      );
      notifications.show({
        title: 'Success',
        message: 'Ability updated successfully',
        color: 'green',
      });
      closeEditAbilityModal();
      // Refresh compare data
      fetchCompareData();
    } catch (error: any) {
      console.error('Failed to update ability:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update ability',
        color: 'red',
      });
    }
    setSavingAbility(false);
  };

  const handleOpenDeleteAbility = (ability: Ability) => {
    setDeletingAbility(ability);
    openDeleteAbilityModal();
  };

  const handleDeleteAbility = async () => {
    if (!deletingAbility?.id) return;
    setDeletingAbilityLoading(true);
    try {
      await apiClient.deleteAbility(deletingAbility.id);
      setAbilities((prev) => prev.filter((a) => a.id !== deletingAbility.id));
      notifications.show({
        title: 'Success',
        message: 'Ability deleted successfully',
        color: 'green',
      });
      closeDeleteAbilityModal();
      // Refresh compare data
      fetchCompareData();
    } catch (error: any) {
      console.error('Failed to delete ability:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete ability. Make sure it is not assigned to any plans.',
        color: 'red',
      });
    }
    setDeletingAbilityLoading(false);
  };

  if (!user || !isAdmin) {
    return null;
  }

  const getRoleBadge = (role: string | undefined) => {
    if (role === 'fan') return <Badge color="blue">Fan</Badge>;
    if (role === 'band') return <Badge color="grape">Band</Badge>;
    if (role === 'blogger') return <Badge color="teal">Blogger</Badge>;
    return <Badge color="gray">Unknown</Badge>;
  };

  const formatPrice = (priceCents: number | undefined) => {
    if (priceCents === undefined || priceCents === 0) return 'Free';
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  // Group compare abilities by category
  const abilitiesByCategory: Record<string, PlansCompareAbility[]> = {};
  if (compareData?.abilities) {
    for (const abilityRow of compareData.abilities) {
      const category = abilityRow.ability?.category || 'Other';
      if (!abilitiesByCategory[category]) {
        abilitiesByCategory[category] = [];
      }
      abilitiesByCategory[category].push(abilityRow);
    }
  }

  return (
    <>
      <Container size="lg">
      <Stack gap="md">
        {/* Page Header */}
        <Paper p="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Plans & Abilities</Title>
              <Text size="sm" c="dimmed">
                Manage subscription plans and feature access
              </Text>
            </div>
            <Badge size="lg" variant="light">
              {plans.length} plans
            </Badge>
          </Group>
        </Paper>

        {dataLoading ? (
            <Center py="xl">
              <Loader size="lg" />
            </Center>
          ) : (
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="plans" leftSection={<IconCrown size={16} />}>
                  Plans ({plans.length})
                </Tabs.Tab>
                <Tabs.Tab value="compare" leftSection={<IconCheck size={16} />}>
                  Comparison Matrix
                </Tabs.Tab>
                <Tabs.Tab value="abilities">
                  All Abilities ({abilities.length})
                </Tabs.Tab>
              </Tabs.List>

              {/* Plans Tab */}
              <Tabs.Panel value="plans" pt="md">
                {plans.length === 0 ? (
                  <Paper p="xl" radius="md" withBorder>
                    <Center>
                      <Stack align="center" gap="md">
                        <IconCrown size={48} color="var(--mantine-color-gray-5)" />
                        <Text c="dimmed" ta="center">
                          No plans configured yet.
                        </Text>
                      </Stack>
                    </Center>
                  </Paper>
                ) : (
                  <Grid>
                    {plans.map((plan) => (
                      <Grid.Col key={plan.id} span={{ base: 12, sm: 6, md: 4 }}>
                        <UnstyledButton
                          onClick={() => handlePlanClick(plan.id)}
                          style={{ width: '100%' }}
                        >
                          <Card
                            p="lg"
                            radius="md"
                            withBorder
                            h="100%"
                            style={{
                              cursor: 'pointer',
                              opacity: plan.active ? 1 : 0.6,
                            }}
                          >
                            <Stack gap="md">
                              <Group justify="space-between">
                                <Group gap="xs">
                                  <IconCrown size={20} color="var(--mantine-color-grape-6)" />
                                  <Title order={4}>{plan.name}</Title>
                                </Group>
                                {getRoleBadge(plan.role)}
                              </Group>

                              <Stack gap="xs">
                                <Group gap="xs">
                                  <Text size="sm" c="dimmed">Monthly:</Text>
                                  <Text fw={600}>{formatPrice(plan.price_cents_monthly)}</Text>
                                </Group>
                                <Group gap="xs">
                                  <Text size="sm" c="dimmed">Annual:</Text>
                                  <Text fw={600}>{formatPrice(plan.price_cents_annual)}</Text>
                                </Group>
                              </Stack>

                              <Group justify="space-between">
                                <Badge variant="light" color="grape">
                                  {plan.abilities_count} abilities
                                </Badge>
                                {!plan.active && (
                                  <Badge color="gray" variant="outline">
                                    Inactive
                                  </Badge>
                                )}
                              </Group>
                            </Stack>
                          </Card>
                        </UnstyledButton>
                      </Grid.Col>
                    ))}
                  </Grid>
                )}
              </Tabs.Panel>

              {/* Compare Tab */}
              <Tabs.Panel value="compare" pt="md">
                {!compareData || !compareData.abilities?.length ? (
                  <Paper p="xl" radius="md" withBorder>
                    <Center>
                      <Stack align="center" gap="md">
                        <IconCheck size={48} color="var(--mantine-color-gray-5)" />
                        <Text c="dimmed" ta="center">
                          No comparison data available.
                        </Text>
                      </Stack>
                    </Center>
                  </Paper>
                ) : (
                  <Paper p="lg" radius="md" withBorder>
                    <div style={{ overflowX: 'auto' }}>
                      <Table
                        verticalSpacing="md"
                        horizontalSpacing="lg"
                        withColumnBorders
                      >
                        <Table.Thead>
                          <Table.Tr style={{ backgroundColor: 'var(--mantine-color-grape-0)' }}>
                            <Table.Th style={{ minWidth: 200 }}>
                              <Text size="md" fw={700}>Feature</Text>
                            </Table.Th>
                            {compareData.plans?.map((plan) => (
                              <Table.Th
                                key={plan.key}
                                ta="center"
                                style={{ minWidth: 140 }}
                              >
                                <Stack gap={4} align="center">
                                  <IconCrown size={20} color="var(--mantine-color-grape-6)" />
                                  <Text size="md" fw={700}>{plan.name}</Text>
                                  {getRoleBadge(plan.role)}
                                </Stack>
                              </Table.Th>
                            ))}
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {Object.entries(abilitiesByCategory).map(([category, abilityRows]) => (
                            <React.Fragment key={`cat-${category}`}>
                              <Table.Tr style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}>
                                <Table.Td colSpan={(compareData.plans?.length ?? 0) + 1}>
                                  <Group gap="xs">
                                    <IconCategory size={18} color="var(--mantine-color-grape-6)" />
                                    <Text fw={700} size="md" c="grape.7" tt="uppercase">
                                      {category}
                                    </Text>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                              {abilityRows.map((row) => (
                                <Table.Tr key={row.ability.key}>
                                  <Table.Td>
                                    <Text size="md" fw={500}>{row.ability.name}</Text>
                                  </Table.Td>
                                  {compareData.plans?.map((plan) => {
                                    const hasAbility = row[plan.key] === true;
                                    return (
                                      <Table.Td
                                        key={`${plan.key}-${row.ability.key}`}
                                        ta="center"
                                        style={{
                                          backgroundColor: hasAbility
                                            ? 'var(--mantine-color-green-0)'
                                            : 'var(--mantine-color-red-0)',
                                        }}
                                      >
                                        {hasAbility ? (
                                          <IconCircleCheckFilled
                                            size={26}
                                            color="var(--mantine-color-green-6)"
                                          />
                                        ) : (
                                          <IconX
                                            size={22}
                                            color="var(--mantine-color-red-4)"
                                            strokeWidth={2.5}
                                          />
                                        )}
                                      </Table.Td>
                                    );
                                  })}
                                </Table.Tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </div>
                  </Paper>
                )}
              </Tabs.Panel>

              {/* Abilities Tab */}
              <Tabs.Panel value="abilities" pt="md">
                <Stack gap="md">
                  <Group justify="flex-end">
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={handleOpenCreateAbility}
                    >
                      Create Ability
                    </Button>
                  </Group>

                  {abilities.length === 0 ? (
                    <Paper p="xl" radius="md" withBorder>
                      <Center>
                        <Stack align="center" gap="md">
                          <IconCheck size={48} color="var(--mantine-color-gray-5)" />
                          <Text c="dimmed" ta="center">
                            No abilities configured yet.
                          </Text>
                          <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={handleOpenCreateAbility}
                          >
                            Create First Ability
                          </Button>
                        </Stack>
                      </Center>
                    </Paper>
                  ) : (
                    <Paper radius="md" withBorder>
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Ability</Table.Th>
                            <Table.Th>Key</Table.Th>
                            <Table.Th>Category</Table.Th>
                            <Table.Th>Plans</Table.Th>
                            <Table.Th>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                      <Table.Tbody>
                        {abilities.map((ability) => (
                          <Table.Tr key={ability.key}>
                            <Table.Td>
                              <Stack gap={2}>
                                <Text size="sm" fw={500}>{ability.name}</Text>
                                {ability.description && (
                                  <Text size="xs" c="dimmed">{ability.description}</Text>
                                )}
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs" ff="monospace" c="dimmed">
                                {ability.key}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" color="grape">
                                {ability.category || 'Other'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={4}>
                                {ability.plans?.map((plan) => (
                                  <Badge key={plan.key} size="xs" variant="outline">
                                    {plan.name}
                                  </Badge>
                                )) ?? <Text size="xs" c="dimmed">None</Text>}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Button
                                  variant="light"
                                  size="xs"
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => handleOpenEditAbility(ability)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="light"
                                  color="red"
                                  size="xs"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() => handleOpenDeleteAbility(ability)}
                                  disabled={(ability.plans?.length ?? 0) > 0}
                                >
                                  Delete
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          )}
        </Stack>
      </Container>

      {/* Plan Detail Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title={selectedPlan?.name || 'Plan Details'}
        position="right"
        size="md"
      >
        {planLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : selectedPlan ? (
          <Stack gap="md">
            {/* Plan Info */}
            <Paper p="md" withBorder radius="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Plan Details</Title>
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconEdit size={14} />}
                  onClick={() => handleEditPlan(selectedPlan)}
                >
                  Edit
                </Button>
              </Group>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Key:</Text>
                  <Text size="sm" ff="monospace">{selectedPlan.key}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Role:</Text>
                  {getRoleBadge(selectedPlan.role)}
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Monthly Price:</Text>
                  <Text size="sm" fw={600}>{formatPrice(selectedPlan.price_cents_monthly)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Annual Price:</Text>
                  <Text size="sm" fw={600}>{formatPrice(selectedPlan.price_cents_annual)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Status:</Text>
                  <Badge color={selectedPlan.active ? 'green' : 'gray'}>
                    {selectedPlan.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Group>
              </Stack>
            </Paper>

            {/* Abilities */}
            <Paper p="md" withBorder radius="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Abilities ({selectedPlan.abilities.length})</Title>
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={handleOpenAddAbility}
                >
                  Add Ability
                </Button>
              </Group>
              <ScrollArea h={400}>
                <Stack gap="xs">
                  {selectedPlan.abilities.length === 0 ? (
                    <Text c="dimmed" ta="center" py="md">
                      No abilities assigned to this plan.
                    </Text>
                  ) : (
                    selectedPlan.abilities.map((ability) => {
                      // Look up the ability ID from the full abilities list
                      const fullAbility = abilities.find((a) => a.key === ability.key);
                      const abilityId = fullAbility?.id;
                      return (
                        <Paper key={ability.key} p="sm" withBorder radius="sm">
                          <Group justify="space-between">
                            <Stack gap={2}>
                              <Text size="sm" fw={500}>{ability.name}</Text>
                              <Badge size="xs" variant="light">
                                {ability.category || 'Other'}
                              </Badge>
                            </Stack>
                            <Button
                              variant="subtle"
                              color="red"
                              size="xs"
                              loading={removingAbilityId === abilityId}
                              onClick={() => abilityId && handleRemoveAbility(abilityId)}
                              disabled={!abilityId}
                              leftSection={<IconMinus size={14} />}
                            >
                              Remove
                            </Button>
                          </Group>
                        </Paper>
                      );
                    })
                  )}
                </Stack>
              </ScrollArea>
            </Paper>
          </Stack>
        ) : (
          <Text c="dimmed">No plan selected</Text>
        )}
      </Drawer>

      {/* Edit Plan Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Plan"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Plan Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <NumberInput
            label="Monthly Price (cents)"
            value={editForm.price_cents_monthly}
            onChange={(value) =>
              setEditForm({ ...editForm, price_cents_monthly: Number(value) || 0 })
            }
            min={0}
            description={`= $${(editForm.price_cents_monthly / 100).toFixed(2)}`}
          />
          <NumberInput
            label="Annual Price (cents)"
            value={editForm.price_cents_annual}
            onChange={(value) =>
              setEditForm({ ...editForm, price_cents_annual: Number(value) || 0 })
            }
            min={0}
            description={`= $${(editForm.price_cents_annual / 100).toFixed(2)}`}
          />
          <Switch
            label="Active"
            description="Inactive plans are hidden from new signups"
            checked={editForm.active}
            onChange={(e) => setEditForm({ ...editForm, active: e.currentTarget.checked })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} loading={saving}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Ability Modal */}
      <Modal
        opened={addAbilityModalOpened}
        onClose={closeAddAbilityModal}
        title="Add Ability to Plan"
        centered
        size="md"
      >
        <ScrollArea h={400}>
          <Stack gap="xs">
            {availableAbilities.length === 0 ? (
              <Text c="dimmed" ta="center" py="md">
                All abilities are already assigned to this plan.
              </Text>
            ) : (
              availableAbilities.map((ability) => (
                <Paper key={ability.key} p="sm" withBorder radius="sm">
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>{ability.name}</Text>
                      <Group gap="xs">
                        <Badge size="xs" variant="light">
                          {ability.category || 'Other'}
                        </Badge>
                        {ability.description && (
                          <Text size="xs" c="dimmed">{ability.description}</Text>
                        )}
                      </Group>
                    </Stack>
                    <Button
                      variant="light"
                      color="green"
                      size="xs"
                      loading={addingAbilityId === ability.id}
                      onClick={() => ability.id && handleAddAbility(ability.id)}
                      leftSection={<IconPlus size={14} />}
                    >
                      Add
                    </Button>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Modal>

      {/* Create Ability Modal */}
      <Modal
        opened={createAbilityModalOpened}
        onClose={closeCreateAbilityModal}
        title="Create New Ability"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Key"
            description="Unique identifier (e.g., create_blog_post)"
            placeholder="ability_key"
            value={abilityForm.key}
            onChange={(e) => setAbilityForm({ ...abilityForm, key: e.target.value })}
            required
          />
          <TextInput
            label="Name"
            description="Display name for the ability"
            placeholder="Create Blog Post"
            value={abilityForm.name}
            onChange={(e) => setAbilityForm({ ...abilityForm, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            description="Optional description of what this ability allows"
            placeholder="Allows users to create and publish blog posts"
            value={abilityForm.description}
            onChange={(e) => setAbilityForm({ ...abilityForm, description: e.target.value })}
          />
          <Select
            label="Category"
            description="Group abilities by category"
            data={categories.map((c) => ({ value: c, label: c }))}
            value={abilityForm.category}
            onChange={(value) => setAbilityForm({ ...abilityForm, category: value || '' })}
            required
            searchable
            allowDeselect={false}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeCreateAbilityModal}>
              Cancel
            </Button>
            <Button onClick={handleCreateAbility} loading={savingAbility}>
              Create Ability
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Ability Modal */}
      <Modal
        opened={editAbilityModalOpened}
        onClose={closeEditAbilityModal}
        title="Edit Ability"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Key"
            description="Cannot be changed after creation"
            value={abilityForm.key}
            disabled
          />
          <TextInput
            label="Name"
            description="Display name for the ability"
            placeholder="Create Blog Post"
            value={abilityForm.name}
            onChange={(e) => setAbilityForm({ ...abilityForm, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            description="Optional description of what this ability allows"
            placeholder="Allows users to create and publish blog posts"
            value={abilityForm.description}
            onChange={(e) => setAbilityForm({ ...abilityForm, description: e.target.value })}
          />
          <Select
            label="Category"
            description="Group abilities by category"
            data={categories.map((c) => ({ value: c, label: c }))}
            value={abilityForm.category}
            onChange={(value) => setAbilityForm({ ...abilityForm, category: value || '' })}
            required
            searchable
            allowDeselect={false}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeEditAbilityModal}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAbility} loading={savingAbility}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Ability Confirmation Modal */}
      <Modal
        opened={deleteAbilityModalOpened}
        onClose={closeDeleteAbilityModal}
        title="Delete Ability"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete the ability{' '}
            <Text component="span" fw={600}>
              {deletingAbility?.name}
            </Text>
            ?
          </Text>
          {(deletingAbility?.plans?.length ?? 0) > 0 && (
            <Paper p="sm" withBorder radius="sm" bg="red.0">
              <Text size="sm" c="red">
                This ability is assigned to {deletingAbility?.plans?.length} plan(s) and cannot be deleted.
                Remove it from all plans first.
              </Text>
            </Paper>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteAbilityModal}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteAbility}
              loading={deletingAbilityLoading}
              disabled={(deletingAbility?.plans?.length ?? 0) > 0}
              leftSection={<IconTrash size={16} />}
            >
              Delete Ability
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
