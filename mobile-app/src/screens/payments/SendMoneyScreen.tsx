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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Input, Card, KYCRequiredModal } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { paymentService } from '../../services/paymentService';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { DEV_CONFIG } from '../../constants/api';

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Send Locally</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Card style={styles.balanceCard}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                Available Balance
              </Text>
              <Text style={[styles.balanceAmount, { color: colors.text }]}>
                {selectedWallet?.currency || 'GHS'}{' '}
                {selectedWallet?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
              </Text>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
            <Input
              label="Recipient"
              placeholder="Phone number or email"
              value={recipient}
              onChangeText={setRecipient}
              leftIcon="person-outline"
              error={errors.recipient}
            />

            <Input
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              leftIcon="cash-outline"
              error={errors.amount}
            />

            <View style={styles.quickAmounts}>
              {quickAmounts.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickAmountButton,
                    { backgroundColor: colors.surfaceVariant },
                    amount === amt.toString() && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setAmount(amt.toString())}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      { color: colors.text },
                      amount === amt.toString() && { color: '#FFFFFF' },
                    ]}
                  >
                    {amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Description (Optional)"
              placeholder="What's this for?"
              value={description}
              onChangeText={setDescription}
              leftIcon="document-text-outline"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.summary}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Transaction Summary</Text>
            <Card>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  GHS {parseFloat(amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Fee</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>GHS 0.00</Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: FontWeight.semibold }]}>
                  Total
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: FontWeight.bold }]}>
                  GHS {parseFloat(amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Button
              title="Send Money"
              onPress={handleSend}
              loading={isLoading}
              fullWidth
              size="lg"
              icon={<Ionicons name="send" size={20} color="#FFFFFF" />}
            />
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
      {/* KYC Required Modal */}
      <KYCRequiredModal
        visible={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        onVerifyNow={() => {
          setShowKYCModal(false);
          navigation.navigate('Profile', { screen: 'KYCVerification' });
        }}
        kycStatus={user?.kyc_status}
      />
    </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.md,
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
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  quickAmountButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  quickAmountText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  summary: {
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSize.md,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});

export default SendMoneyScreen;
