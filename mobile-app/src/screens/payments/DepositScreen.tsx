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
  Image,
  ImageSourcePropType,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input, Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { TelecomLogos } from '../../assets/logos';
import paymentGateway from '../../services/paymentGateway';
import mobileMoneyService, { detectNetwork } from '../../services/mobileMoneyService';

interface DepositMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: 'mobile_money' | 'bank' | 'card';
  logo?: ImageSourcePropType;
}

const DepositScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { selectedWallet } = useWalletStore();

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const depositMethods: DepositMethod[] = [
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      description: 'Deposit via MTN MoMo',
      icon: 'phone-portrait',
      color: '#FFCC00',
      type: 'mobile_money',
      logo: TelecomLogos.mtn,
    },
    {
      id: 'telecel',
      name: 'Telecel Cash',
      description: 'Deposit via Telecel Cash',
      icon: 'phone-portrait',
      color: '#E60000',
      type: 'mobile_money',
      logo: TelecomLogos.telecel,
    },
    {
      id: 'airteltigo',
      name: 'AirtelTigo Money',
      description: 'Deposit via AirtelTigo Money',
      icon: 'phone-portrait',
      color: '#FF0000',
      type: 'mobile_money',
      logo: TelecomLogos.airteltigo,
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Transfer from your bank account',
      icon: 'business',
      color: '#3B82F6',
      type: 'bank',
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Visa, Mastercard accepted',
      icon: 'card',
      color: '#8B5CF6',
      type: 'card',
    },
  ];

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const { user } = useAuthStore();
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  // Auto-detect network from phone number
  useEffect(() => {
    if (mobileMoneyNumber.length >= 3) {
      const detected = detectNetwork(mobileMoneyNumber);
      if (detected && selectedMethod?.type === 'mobile_money') {
        const matchingMethod = depositMethods.find(m => m.id === detected);
        if (matchingMethod) {
          setSelectedMethod(matchingMethod);
        }
      }
    }
  }, [mobileMoneyNumber]);

  const handleDeposit = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a deposit method');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (selectedMethod.type === 'mobile_money' && (!mobileMoneyNumber || mobileMoneyNumber.length < 10)) {
      Alert.alert('Error', 'Please enter a valid mobile money number');
      return;
    }

    const depositAmount = parseFloat(amount);
    const userEmail = user?.email || '';

    setIsLoading(true);
    try {
      if (selectedMethod.type === 'mobile_money') {
        // Use payment gateway for mobile money deposit
        const networkId = selectedMethod.id;
        // Map telecel to vodafone for payment gateway compatibility
        const network = networkId === 'telecel' ? 'vodafone' : networkId as 'mtn' | 'vodafone' | 'airteltigo';
        const response = await paymentGateway.initializeMobileMoneyPayment(
          userEmail,
          depositAmount,
          mobileMoneyNumber,
          network
        );

        if (response.success) {
          setPaymentReference(response.reference);
          Alert.alert(
            'Deposit Initiated',
            response.message || `A prompt has been sent to ${mobileMoneyNumber}. Please approve the transaction on your phone to complete the deposit of GHS ${amount}.`,
            [
              { text: 'Check Status', onPress: () => checkPaymentStatus(response.reference) },
              { text: 'OK', onPress: () => navigation.goBack() },
            ]
          );
        } else {
          Alert.alert('Error', response.message || 'Failed to initiate deposit');
        }
      } else if (selectedMethod.type === 'bank') {
        // Initialize bank transfer
        const response = await paymentGateway.initializeBankTransfer(
          userEmail,
          depositAmount
        );

        if (response.success && response.bankDetails) {
          Alert.alert(
            'Bank Transfer Details',
            `Transfer GHS ${amount} to:\n\nBank: ${response.bankDetails.bankName}\nAccount: ${response.bankDetails.accountNumber}\nName: ${response.bankDetails.accountName}\nReference: ${response.bankDetails.reference}\n\nYour account will be credited once we confirm the transfer.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Error', response.message || 'Failed to get bank transfer details. Please try again.');
        }
      } else if (selectedMethod.type === 'card') {
        // Initialize card payment
        const response = await paymentGateway.initializeCardPayment(
          userEmail,
          depositAmount,
          { deposit_type: 'wallet_topup' }
        );

        if (response.success) {
          setPaymentReference(response.reference);
          
          if (response.authorizationUrl) {
            // Open payment page in browser
            Alert.alert(
              'Card Payment',
              'You will be redirected to complete your card payment securely.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Continue', 
                  onPress: () => {
                    Linking.openURL(response.authorizationUrl!);
                  }
                },
              ]
            );
          } else {
            Alert.alert('Success', 'Payment initiated. Please complete the payment.');
          }
        } else {
          Alert.alert('Error', response.message || 'Failed to initialize card payment');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process deposit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (reference: string) => {
    try {
      const result = await paymentGateway.verifyPayment(reference);
      if (result.success) {
        Alert.alert(
          'Payment Successful',
          `GHS ${result.amount} has been deposited to your wallet!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (result.status === 'pending') {
        Alert.alert(
          'Payment Pending',
          'Your payment is still being processed. Please check again in a moment.',
          [
            { text: 'Check Again', onPress: () => checkPaymentStatus(reference) },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert('Payment Failed', result.message || 'The payment was not successful.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check payment status');
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
          <Text style={[styles.title, { color: colors.text }]}>Deposit Funds</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              <View style={styles.walletHeader}>
                <Ionicons name="wallet" size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.walletLabel}>Current Balance</Text>
              </View>
              <Text style={styles.walletBalance}>
                {selectedWallet?.currency || 'GHS'}{' '}
                {selectedWallet?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
              </Text>
              <Text style={styles.walletHint}>Top up your wallet to send money and pay bills</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Amount (GHS)</Text>
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
              placeholder="Or enter custom amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              leftIcon="cash-outline"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Deposit Method</Text>
            {depositMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  selectedMethod?.id === method.id && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setSelectedMethod(method)}
              >
                {method.logo ? (
                  <Image source={method.logo} style={styles.methodLogoImage} resizeMode="contain" />
                ) : (
                  <View style={[styles.methodIcon, { backgroundColor: method.color + '15' }]}>
                    <Ionicons name={method.icon as any} size={24} color={method.color} />
                  </View>
                )}
                <View style={styles.methodContent}>
                  <Text style={[styles.methodName, { color: colors.text }]}>{method.name}</Text>
                  <Text style={[styles.methodDescription, { color: colors.textMuted }]}>
                    {method.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: selectedMethod?.id === method.id ? colors.primary : colors.border },
                  ]}
                >
                  {selectedMethod?.id === method.id && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {selectedMethod?.type === 'mobile_money' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
              <Input
                label="Mobile Money Number"
                placeholder="Enter your mobile money number"
                value={mobileMoneyNumber}
                onChangeText={setMobileMoneyNumber}
                keyboardType="phone-pad"
                leftIcon="call-outline"
              />
            </Animated.View>
          )}

          {selectedMethod?.type === 'bank' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
              <Card>
                <View style={styles.bankDetails}>
                  <Text style={[styles.bankTitle, { color: colors.text }]}>Bank Transfer</Text>
                  <View style={[styles.bankNote, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="information-circle" size={16} color={colors.primary} />
                    <Text style={[styles.bankNoteText, { color: colors.primary }]}>
                      Bank transfer details will be provided after you initiate the deposit
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Card>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Deposit Amount</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  GHS {parseFloat(amount || '0').toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Fee</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>FREE</Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: FontWeight.semibold }]}>
                  You'll Receive
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: FontWeight.bold }]}>
                  GHS {parseFloat(amount || '0').toFixed(2)}
                </Text>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <Button
              title="Deposit Now"
              onPress={handleDeposit}
              loading={isLoading}
              fullWidth
              size="lg"
              disabled={!selectedMethod || !amount}
              icon={<Ionicons name="add-circle" size={20} color="#FFFFFF" />}
            />
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
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
  walletCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  walletLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  walletHint: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  methodLogoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: Spacing.md,
  },
  methodContent: {
    flex: 1,
  },
  methodName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  methodDescription: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bankDetails: {},
  bankTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  bankLabel: {
    fontSize: FontSize.sm,
  },
  bankValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  bankNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  bankNoteText: {
    fontSize: FontSize.xs,
    flex: 1,
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
  },
});

export default DepositScreen;
