import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '@/components';
import { theme, colors } from '@/theme';
import { RootStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function EditProfileScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Edit Profile"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Text style={styles.text}>Edit Profile coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  text: {
    fontSize: theme.fontSizes.base,
    color: colors.grape[5],
  },
});
