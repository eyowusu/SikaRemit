import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  FadeInRight,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';
import { Button, Input, Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList } from '../../types';
import { 
  BorderRadius, 
  FontSize, 
  FontWeight, 
  Spacing, 
  Shadow, 
  AnimationConfig, 
  ComponentSize 
} from '../../constants/theme';

const { width } = Dimensions.get('window');

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid 10-digit phone number';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!acceptedTerms) newErrors.terms = 'You must accept the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        password: formData.password,
      });
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]
      );
    } catch (err: any) {
      // Error is handled by the store
    }
  };

  const handleTermsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Terms and Conditions',
      'By using SikaRemit, you agree to our terms of service and privacy policy. We will handle your data with care and provide secure financial services.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.lg }]}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <View style={styles.placeholder} />
          </Animated.View>

          {/* Logo/Brand Section */}
          <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.brandSection}>
            <LinearGradient
              colors={colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.logoContainer, Shadow.floating]}
            >
              <View style={styles.logoContent}>
                <Text style={styles.logoText}>Sika</Text>
                <Text style={styles.logoSubtext}>Remit</Text>
              </View>
            </LinearGradient>
            
            <View style={styles.brandInfo}>
              <Text style={[styles.brandTitle, { color: colors.text }]}>
                Join SikaRemit
              </Text>
              <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
                Create your account to start sending money, paying bills, and managing your finances
              </Text>
            </View>
          </Animated.View>

          {/* Registration Form */}
          <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.formSection}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Input
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChangeText={(value) => updateField('firstName', value)}
                  error={errors.firstName}
                  variant="glass"
                  style={styles.input}
                />
              </View>
              <View style={styles.nameField}>
                <Input
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChangeText={(value) => updateField('lastName', value)}
                  error={errors.lastName}
                  variant="glass"
                  style={styles.input}
                />
              </View>
            </View>

            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Ionicons name="mail" size={20} color={colors.textMuted} />}
              error={errors.email}
              variant="glass"
              style={styles.input}
            />

            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="phone-portrait" size={20} color={colors.textMuted} />}
              error={errors.phone}
              variant="glass"
              style={styles.input}
            />

            <Input
              label="Password"
              placeholder="Create password"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed" size={20} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity>
                  <Ionicons name="eye-off" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              }
              error={errors.password}
              variant="glass"
              style={styles.input}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed" size={20} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity>
                  <Ionicons name="eye-off" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              }
              error={errors.confirmPassword}
              variant="glass"
              style={styles.input}
            />

            {error && (
              <Animated.View entering={FadeInRight.duration(400)}>
                <Card variant="default" padding="md" style={styles.errorCard}>
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                  </Text>
                </Card>
              </Animated.View>
            )}

            {/* Terms and Conditions */}
            <Animated.View entering={FadeInUp.duration(600).delay(600)} style={styles.termsSection}>
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: acceptedTerms ? colors.primary : colors.surface,
                    borderColor: acceptedTerms ? colors.primary : colors.borderLight,
                  }
                ]}>
                  {acceptedTerms && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.termsContent}>
                  <Text style={[styles.termsText, { color: colors.text }]}>
                    I agree to the{' '}
                    <Text style={[styles.termsLink, { color: colors.primary }]} onPress={handleTermsPress}>
                      Terms and Conditions
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
              {errors.terms && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.terms}
                </Text>
              )}
            </Animated.View>

            {/* Register Button */}
            <Animated.View entering={FadeInUp.duration(800).delay(800)} style={styles.buttonSection}>
              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                gradient={true}
                fullWidth={true}
                size="lg"
              />
            </Animated.View>

            {/* Login Link */}
            <Animated.View entering={FadeInUp.duration(800).delay(1000)} style={styles.loginSection}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: ComponentSize.iconButton.md,
    height: ComponentSize.iconButton.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold as any,
  },
  placeholder: {
    width: ComponentSize.iconButton.md,
  },
  brandSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoContent: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black as any,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.light as any,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brandInfo: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold as any,
    marginBottom: Spacing.xs,
  },
  brandSubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    color: '#94A3B8',
    lineHeight: 22,
  },
  formSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameField: {
    flex: 1,
  },
  input: {
    marginBottom: Spacing.md,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as any,
  },
  termsSection: {
    marginBottom: Spacing.lg,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  termsContent: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  termsText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  termsLink: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold as any,
  },
  buttonSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loginSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loginText: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  loginLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold as any,
  },
});

export default RegisterScreen;
