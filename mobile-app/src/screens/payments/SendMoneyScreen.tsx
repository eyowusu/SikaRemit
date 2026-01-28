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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
import { Button, Input, Card, KYCRequiredModal } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { paymentService } from '../../services/paymentService';
import { 
  BorderRadius, 
  FontSize, 
  FontWeight, 
  Spacing, 
  Shadow, 
  AnimationConfig, 
  ComponentSize 
} from '../../constants/theme';
import { DEV_CONFIG } from '../../constants/api';

const { width } = Dimensions.get('window');

const SendMoneyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { selectedWallet } = useWalletStore();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Check KYC status on mount (bypassed in development mode)
  useEffect(() => {
    if (!DEV_CONFIG.BYPASS_KYC && user && user.kyc_status !== 'approved') {
      setShowKYCModal(true);
    }
  }, [user]);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!recipient) newErrors.recipient = 'Recipient is required';
    if (!amount) newErrors.amount = 'Amount is required';
    else if (parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    else if (selectedWallet && parseFloat(amount) > selectedWallet.balance) {
      newErrors.amount = 'Insufficient balance';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    // Check KYC before allowing send (bypassed in development mode)
    if (!DEV_CONFIG.BYPASS_KYC && user?.kyc_status !== 'approved') {
      setShowKYCModal(true);
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await paymentService.sendMoney({
        recipient_phone: recipient,
        amount: parseFloat(amount),
        currency: selectedWallet?.currency || 'GHS',
        description,
      });
      Alert.alert('Success', 'Money sent successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send money');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAmount = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(value.toString());
  };

  const handleContactSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to contacts screen
    Alert.alert('Coming Soon', 'Contact selection will be available soon');
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
            <Text style={[styles.title, { color: colors.text }]}>Send Money</Text>
            <View style={styles.placeholder} />
          </Animated.View>

          {/* Balance Card */}
          <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.section}>
            <Card variant="default" padding="lg">
              <View style={styles.balanceHeader}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                  Available Balance
                </Text>
                <Text style={[styles.balanceAmount, { color: colors.text }]}>
                  GHS {selectedWallet?.balance.toLocaleString() || '0.00'}
                </Text>
              </View>
              <View style={styles.balanceFooter}>
                <Text style={[styles.walletName, { color: colors.textMuted }]}>
                  {selectedWallet?.currency || 'GHS'}
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* Recipient Section */}
          <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recipient</Text>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: colors.surface }]}
              onPress={handleContactSelect}
            >
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={[styles.contactButtonText, { color: colors.primary }]}>
                Choose from Contacts
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <Input
              placeholder="Enter phone number"
              value={recipient}
              onChangeText={setRecipient}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="person" size={20} color={colors.textMuted} />}
              error={errors.recipient}
              variant="glass"
            />
          </Animated.View>

          {/* Amount Section */}
          <Animated.View entering={FadeInUp.duration(800).delay(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Amount</Text>
            <Card variant="default" padding="lg" style={styles.amountCard}>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.currencySymbol, { color: colors.primary }]}>GHS</Text>
                <Input
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  variant="minimal"
                  size="lg"
                  style={styles.amountInput}
                  textAlign="right"
                />
              </View>
            </Card>

            {/* Quick Amounts */}
            <View style={styles.quickAmountsContainer}>
              <Text style={[styles.quickAmountsLabel, { color: colors.textSecondary }]}>
                Quick amounts
              </Text>
              <View style={styles.quickAmountsGrid}>
                {quickAmounts.map((value, index) => (
                  <Animated.View
                    key={value}
                    entering={FadeInUp.duration(400).delay(800 + index * 50)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.quickAmountButton,
                        { 
                          backgroundColor: amount === value.toString() 
                            ? colors.primary 
                            : colors.surface 
                        }
                      ]}
                      onPress={() => handleQuickAmount(value)}
                    >
                      <Text style={[
                        styles.quickAmountText,
                        { 
                          color: amount === value.toString() 
                            ? '#FFFFFF' 
                            : colors.text 
                        }
                      ]}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInUp.duration(800).delay(800)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Description (Optional)
            </Text>
            <Input
              placeholder="Add a note..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              leftIcon={<Ionicons name="document-text-outline" size={20} color={colors.textMuted} />}
              variant="default"
            />
          </Animated.View>

          {/* Send Button */}
          <Animated.View entering={FadeInUp.duration(800).delay(1000)} style={styles.section}>
            <Button
              title={`Send GHS ${amount || '0.00'}`}
              onPress={handleSend}
              loading={isLoading}
              disabled={!recipient || !amount || parseFloat(amount) <= 0}
              gradient={true}
              fullWidth={true}
              size="lg"
            />
          </Animated.View>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>

        {/* KYC Modal */}
        <KYCRequiredModal
          visible={showKYCModal}
          onClose={() => setShowKYCModal(false)}
          onVerifyNow={() => navigation.navigate('KYCVerification')}
        />
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
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold as any,
    marginBottom: Spacing.md,
  },
  balanceHeader: {
    marginBottom: Spacing.sm,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as any,
  },
  balanceAmount: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold as any,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as any,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Spacing.md,
  },
  contactButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold as any,
    flex: 1,
    textAlign: 'center',
  },
  amountCard: {
    marginBottom: Spacing.lg,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold as any,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  quickAmountsContainer: {
    marginTop: Spacing.lg,
  },
  quickAmountsLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as any,
    marginBottom: Spacing.md,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    width: (width - Spacing.lg * 2 - Spacing.md * 5) / 6,
    height: ComponentSize.buttonHeight.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickAmountText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold as any,
  },
});

export default SendMoneyScreen;
