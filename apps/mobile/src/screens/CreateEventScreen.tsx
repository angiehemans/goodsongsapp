import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Header, TextInput, Button } from '@/components';
import { theme, colors } from '@/theme';
import { apiClient } from '@/utils/api';
import { Band } from '@goodsongs/api-client';

const AGE_RESTRICTIONS = ['All Ages', '18+', '21+'];

interface FormData {
  name: string;
  description: string;
  event_date: Date;
  ticket_link: string;
  price: string;
  age_restriction: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_region: string;
}

export function CreateEventScreen({ navigation }: any) {
  const [band, setBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    event_date: new Date(),
    ticket_link: '',
    price: '',
    age_restriction: '',
    venue_name: '',
    venue_address: '',
    venue_city: '',
    venue_region: '',
  });

  const fetchBand = useCallback(async () => {
    try {
      const bands = await apiClient.getUserBands();
      if (bands.length > 0) {
        setBand(bands[0]);
      }
    } catch (error) {
      console.error('Failed to fetch band:', error);
      Alert.alert('Error', 'Failed to load band details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBand();
  }, [fetchBand]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.venue_name.trim() !== '' &&
      formData.venue_city.trim() !== ''
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Preserve the time from the current event_date
      const newDate = new Date(selectedDate);
      newDate.setHours(formData.event_date.getHours());
      newDate.setMinutes(formData.event_date.getMinutes());
      updateField('event_date', newDate);
    }
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Preserve the date from the current event_date
      const newDate = new Date(formData.event_date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      updateField('event_date', newDate);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Missing Fields', 'Please fill in event name, venue name, and venue city.');
      return;
    }

    if (!band) {
      Alert.alert('Error', 'No band found');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createEvent(band.slug, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        event_date: formData.event_date.toISOString(),
        ticket_link: formData.ticket_link.trim() || undefined,
        price: formData.price.trim() || undefined,
        age_restriction: formData.age_restriction || undefined,
        venue_attributes: {
          name: formData.venue_name.trim(),
          address: formData.venue_address.trim() || undefined,
          city: formData.venue_city.trim(),
          region: formData.venue_region.trim() || undefined,
        },
      });

      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error: any) {
      console.error('Failed to create event:', error);
      Alert.alert('Error', error.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Create Event" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!band) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Create Event" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No band found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Create Event" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Event Name */}
          <TextInput
            label="Event Name *"
            placeholder="Summer Concert, Album Release, etc."
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            leftIcon="calendar"
          />

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.textAreaContainer}>
              <RNTextInput
                style={styles.textArea}
                placeholder="Tell fans about this event..."
                placeholderTextColor={colors.grape[4]}
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Date & Time */}
          <Text style={styles.sectionTitle}>Date & Time</Text>

          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>{formatDate(formData.event_date)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateTimeValue}>{formatTime(formData.event_date)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.event_date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={formData.event_date}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}

          {/* Venue */}
          <Text style={styles.sectionTitle}>Venue</Text>

          <TextInput
            label="Venue Name *"
            placeholder="The Blue Note, Madison Square Garden, etc."
            value={formData.venue_name}
            onChangeText={(text) => updateField('venue_name', text)}
            leftIcon="map-pin"
          />

          <TextInput
            label="Address"
            placeholder="123 Main Street"
            value={formData.venue_address}
            onChangeText={(text) => updateField('venue_address', text)}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextInput
                label="City *"
                placeholder="New York"
                value={formData.venue_city}
                onChangeText={(text) => updateField('venue_city', text)}
              />
            </View>
            <View style={styles.halfField}>
              <TextInput
                label="State / Region"
                placeholder="NY"
                value={formData.venue_region}
                onChangeText={(text) => updateField('venue_region', text)}
              />
            </View>
          </View>

          {/* Details */}
          <Text style={styles.sectionTitle}>Details</Text>

          <TextInput
            label="Ticket Link"
            placeholder="https://tickets.example.com/..."
            value={formData.ticket_link}
            onChangeText={(text) => updateField('ticket_link', text)}
            autoCapitalize="none"
            keyboardType="url"
            leftIcon="link"
          />

          <TextInput
            label="Price"
            placeholder="$15, Free, $10-$20, etc."
            value={formData.price}
            onChangeText={(text) => updateField('price', text)}
            leftIcon="dollar-sign"
          />

          {/* Age Restriction */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Age Restriction</Text>
            <View style={styles.ageButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.ageButton,
                  formData.age_restriction === '' && styles.ageButtonSelected,
                ]}
                onPress={() => updateField('age_restriction', '')}
              >
                <Text
                  style={[
                    styles.ageButtonText,
                    formData.age_restriction === '' && styles.ageButtonTextSelected,
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {AGE_RESTRICTIONS.map((age) => (
                <TouchableOpacity
                  key={age}
                  style={[
                    styles.ageButton,
                    formData.age_restriction === age && styles.ageButtonSelected,
                  ]}
                  onPress={() => updateField('age_restriction', age)}
                >
                  <Text
                    style={[
                      styles.ageButtonText,
                      formData.age_restriction === age && styles.ageButtonTextSelected,
                    ]}
                  >
                    {age}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title="Create Event"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!isFormValid()}
            fullWidth
          />

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSizes.base,
    color: colors.grape[5],
  },
  content: {
    padding: theme.spacing.md,
  },
  fieldContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[4],
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.cooperBold,
    color: theme.colors.secondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  textAreaContainer: {
    backgroundColor: colors.grape[0],
    borderWidth: theme.borderWidth,
    borderColor: colors.grape[6],
    borderRadius: theme.radii.md,
  },
  textArea: {
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.base,
    color: colors.grape[8],
    minHeight: 100,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: colors.grape[1],
    borderWidth: 2,
    borderColor: colors.grape[3],
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  dateTimeLabel: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    marginBottom: theme.spacing.xs,
  },
  dateTimeValue: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfField: {
    flex: 1,
  },
  ageButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  ageButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: colors.grape[1],
    borderWidth: 1,
    borderColor: colors.grape[3],
  },
  ageButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  ageButtonText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
  },
  ageButtonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
});
