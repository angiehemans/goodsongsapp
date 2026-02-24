import React, { useState, useMemo } from "react";
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import Icon from "@react-native-vector-icons/feather";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";

type IconName = React.ComponentProps<typeof Icon>["name"];

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function TextInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  ...props
}: TextInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = secureTextEntry !== undefined;
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, themedStyles.label]}>{label}</Text>}
      <View style={[styles.inputContainer, themedStyles.inputContainer, error && styles.inputError]}>
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={18}
            color={colors.iconMuted}
            style={styles.leftIcon}
          />
        )}
        <RNTextInput
          style={[styles.input, themedStyles.input, leftIcon && styles.inputWithLeftIcon]}
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={isPassword && !isPasswordVisible}
          autoCapitalize={isPassword ? "none" : props.autoCapitalize}
          autoCorrect={isPassword ? false : props.autoCorrect}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconButton}
          >
            <Icon
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={18}
              color={colors.iconMuted}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
          >
            <Icon name={rightIcon} size={18} color={colors.iconMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    label: {
      color: colors.textPlaceholder,
    },
    inputContainer: {
      backgroundColor: colors.bgInput,
      borderColor: colors.borderStrong,
    },
    input: {
      color: colors.textSecondary,
    },
  });

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: theme.borderWidth,
    borderRadius: theme.radii.md,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.base,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  leftIcon: {
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  rightIconButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.fontSizes.xs,
    color: '#EF4444',
    marginTop: theme.spacing.xs,
  },
});
