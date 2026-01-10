import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import kycService from '../../services/kycService';

const KYCVerificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleStartVerification = async () => {
    setIsLoading(true);
    try {
      // Start the KYC verification flow
      const result = await kycService.startVerification() as any;
      
      if (result.id || result.success) {
        // Navigate to document upload screen or show next step
        Alert.alert(
          'Verification Started',
          'Please have your ID document ready. You will need to take a photo of your ID and a selfie.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to document capture screen
                navigation.navigate('KYCDocumentCapture', { 
                  verificationId: result.id || result.verificationId 
                });
              },
            },
            { text: 'Later', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to start verification');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start KYC verification');
    } finally {
      setIsLoading(false);
    }
  };

  const kycSteps = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Name, date of birth, address',
      icon: 'person',
      status: 'completed',
    },
    {
      id: 'identity',
      title: 'Identity Document',
      description: 'Passport, National ID, or Driver\'s License',
      icon: 'card',
      status: user?.kyc_status === 'approved' ? 'completed' : 'pending',
    },
    {
      id: 'selfie',
      title: 'Selfie Verification',
      description: 'Take a photo holding your ID',
      icon: 'camera',
      status: user?.kyc_status === 'approved' ? 'completed' : 'not_started',
    },
    {
      id: 'address',
      title: 'Proof of Address',
      description: 'Utility bill or bank statement',
      icon: 'home',
      status: user?.kyc_status === 'approved' ? 'completed' : 'not_started',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'rejected': return 'close-circle';
      default: return 'ellipse-outline';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>KYC Verification</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Card variant={user?.kyc_status === 'approved' ? 'default' : 'gradient'}>
            <View style={styles.statusCard}>
              <View style={[styles.statusIconContainer, { backgroundColor: user?.kyc_status === 'approved' ? colors.success + '20' : 'rgba(255,255,255,0.2)' }]}>
                <Ionicons
                  name={user?.kyc_status === 'approved' ? 'shield-checkmark' : 'shield-outline'}
                  size={32}
                  color={user?.kyc_status === 'approved' ? colors.success : '#FFFFFF'}
                />
              </View>
              <View style={styles.statusContent}>
                <Text style={[styles.statusTitle, { color: user?.kyc_status === 'approved' ? colors.text : '#FFFFFF' }]}>
                  {user?.kyc_status === 'approved' ? 'Verified Account' : 'Complete Your Verification'}
                </Text>
                <Text style={[styles.statusDescription, { color: user?.kyc_status === 'approved' ? colors.textSecondary : 'rgba(255,255,255,0.8)' }]}>
                  {user?.kyc_status === 'approved'
                    ? 'Your identity has been verified. You have full access to all features.'
                    : 'Verify your identity to unlock higher transaction limits and all features.'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification Steps</Text>
          <Card padding="none">
            {kycSteps.map((step, index) => (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepItem,
                  index < kycSteps.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                ]}
              >
                <View style={[styles.stepIcon, { backgroundColor: getStatusColor(step.status) + '15' }]}>
                  <Ionicons name={step.icon as any} size={24} color={getStatusColor(step.status)} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                  <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                    {step.description}
                  </Text>
                </View>
                <Ionicons
                  name={getStatusIcon(step.status) as any}
                  size={24}
                  color={getStatusColor(step.status)}
                />
              </TouchableOpacity>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Benefits of Verification</Text>
          <Card>
            <View style={styles.benefitsList}>
              {[
                'Higher transaction limits',
                'International transfers',
                'Premium customer support',
                'Access to all payment methods',
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {user?.kyc_status !== 'approved' && (
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Button
              title={isLoading ? 'Processing...' : 'Start Verification'}
              onPress={handleStartVerification}
              fullWidth
              size="lg"
              loading={isLoading}
              icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
              iconPosition="right"
            />
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  stepDescription: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  benefitsList: {
    gap: Spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    fontSize: FontSize.md,
  },
});

export default KYCVerificationScreen;
