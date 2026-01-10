import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing, Shadow, ComponentSize } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  gradient?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  gradient = false,
  disabled,
  onPress,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const handlePress = async (e: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { 
            height: ComponentSize.buttonHeight.sm,
            paddingHorizontal: Spacing.md,
          },
          text: { fontSize: FontSize.sm },
        };
      case 'lg':
        return {
          container: { 
            height: ComponentSize.buttonHeight.lg,
            paddingHorizontal: Spacing.xl,
          },
          text: { fontSize: FontSize.lg },
        };
      default:
        return {
          container: { 
            height: ComponentSize.buttonHeight.md,
            paddingHorizontal: Spacing.lg,
          },
          text: { fontSize: FontSize.md },
        };
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: colors.secondary },
          text: { color: colors.text },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.border,
          },
          text: { color: colors.text },
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.primary },
        };
      case 'destructive':
        return {
          container: { backgroundColor: colors.error },
          text: { color: '#FFFFFF' },
        };
      default:
        return {
          container: { 
            backgroundColor: colors.primary,
            ...Shadow.button,
          },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...sizeStyles.container,
    ...variantStyles.container,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { opacity: 0.5 }),
  };

  const textStyle: TextStyle = {
    ...styles.text,
    ...sizeStyles.text,
    ...variantStyles.text,
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[textStyle, icon && iconPosition === 'left' ? { marginLeft: Spacing.sm } : undefined]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  );

  if (variant === 'primary' && gradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[fullWidth && { width: '100%' }, style]}
        {...props}
      >
        <LinearGradient
          colors={colors.gradient.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[containerStyle, { backgroundColor: undefined }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[containerStyle, style]}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
  },
  text: {
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default Button;
