import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Input } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList } from '../../types';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import biometricService from '../../services/biometricService';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { login, isLoading, error, clearError, biometricEnabled } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);

  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      const capabilities = await biometricService.checkAvailability();
      const hasCredentials = await biometricService.hasStoredCredentials();
      setBiometricAvailable(capabilities.isAvailable && capabilities.isEnrolled && hasCredentials && biometricEnabled);
      
      if (hasCredentials) {
        const email = await biometricService.getStoredEmail();
        setStoredEmail(email);
      }
    };
    checkBiometrics();
  }, [biometricEnabled]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const biometricType = await biometricService.getBiometricTypeName();
      const result = await biometricService.authenticateAndGetCredentials(
        `Log in to SikaRemit with ${biometricType}`
      );

      if (result.success && result.credentials) {
        // Use retrieved credentials to login
        await login(result.credentials.email, result.credentials.password);
      } else if (result.error === 'User chose to use password') {
        // User wants to use password instead, do nothing
      } else if (result.error) {
        Alert.alert('Authentication Failed', result.error);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Biometric authentication failed');
    }
  };

  // Store credentials after successful login for future biometric use
  const handleLoginWithCredentialStorage = async () => {
    if (!validateForm()) return;
    
    try {
      await login(email, password);
      
      // If biometric is enabled, store credentials for future use
      if (biometricEnabled) {
        await biometricService.storeCredentials(email, password);
      }
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to continue to SikaRemit
          </Text>
        </Animated.View>

        {error && (
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}
          >
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={20} color={colors.error} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
          />

          {biometricEnabled && (
            <TouchableOpacity
              style={[styles.biometricButton, { borderColor: colors.border }]}
              onPress={handleBiometricLogin}
            >
              <Ionicons name="finger-print" size={28} color={colors.primary} />
              <Text style={[styles.biometricText, { color: colors.text }]}>
                Use Biometrics
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="logo-apple" size={24} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  biometricText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.md,
  },
  footerLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});

export default LoginScreen;
