import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
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
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { TelecomLogos } from '../../assets/logos';
import { DEV_CONFIG } from '../../constants/api';
import exchangeRateService, { ExchangeRate } from '../../services/exchangeRateService';
import { paymentService } from '../../services/paymentService';

const RemittanceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { wallets } = useWalletStore();

  const [sendAmount, setSendAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({ code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('wallet');
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check KYC status on mount - international transfers require KYC (bypassed in development mode)
  useEffect(() => {
    if (!DEV_CONFIG.BYPASS_KYC && user && user.kyc_status !== 'approved') {
      setShowKYCModal(true);
    }
  }, [user]);

  // Fetch exchange rate when country changes
  useEffect(() => {
    const fetchRate = async () => {
      setIsLoadingRate(true);
      try {
        const rate = await exchangeRateService.getExchangeRate('GHS', selectedCountry.currency);
        setExchangeRate(rate);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      } finally {
        setIsLoadingRate(false);
      }
    };
    fetchRate();
  }, [selectedCountry.currency]);

  const handleContinue = async () => {
    // Check KYC before allowing remittance (bypassed in development mode)
    if (!DEV_CONFIG.BYPASS_KYC && user?.kyc_status !== 'approved') {
      setShowKYCModal(true);
      return;
    }

    // Validate inputs
    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!recipientName.trim()) {
      Alert.alert('Error', 'Please enter recipient name');
      return;
    }
    if (!recipientPhone.trim()) {
      Alert.alert('Error', 'Please enter recipient phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate fee
      const amount = parseFloat(sendAmount);
      const fee = exchangeRateService.calculateRemittanceFee(amount, 'GHS', selectedCountry.currency);
      const rate = exchangeRate?.sellRate || exchangeRate?.rate || 1;

      // Call remittance API
      const response = await paymentService.sendRemittance({
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_country: selectedCountry.code,
        amount: amount,
        source_currency: 'GHS',
        target_currency: selectedCountry.currency,
        exchange_rate: rate,
        fee: fee,
        payment_method: selectedPaymentMethod,
      });

      Alert.alert(
        'Transfer Initiated',
        `Your transfer of ${selectedCountry.currency} ${((amount - fee) * rate).toFixed(2)} to ${recipientName} has been initiated.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to initiate transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const walletBalance = wallets.reduce((sum: number, w: { balance: number }) => sum + w.balance, 0);

  const paymentMethods = [
    { id: 'wallet', name: 'SikaRemit Balance', icon: 'wallet', balance: walletBalance },
    { id: 'mtn_momo', name: 'MTN Mobile Money', icon: 'phone-portrait', color: '#FFCC00', logo: TelecomLogos.mtn },
    { id: 'telecel_cash', name: 'Telecel Cash', icon: 'phone-portrait', color: '#E60000', logo: TelecomLogos.telecel },
    { id: 'card', name: 'Debit/Credit Card', icon: 'card', color: '#3B82F6' },
  ];

  // Get supported countries from exchange rate service currencies
  const currencies = exchangeRateService.getCurrencies();
  const countries = currencies
    .filter(c => c.code !== 'GHS' && c.isActive)
    .map(c => ({
      code: c.code.substring(0, 2),
      name: c.country,
      flag: c.flag,
      currency: c.code,
    }));

  // Calculate dynamic values
  const currentRate = exchangeRate?.sellRate || exchangeRate?.rate || 0;
  const fee = sendAmount ? exchangeRateService.calculateRemittanceFee(
    parseFloat(sendAmount), 
    'GHS', 
    selectedCountry.currency
  ) : 0;
  const receiveAmount = sendAmount && currentRate 
    ? ((parseFloat(sendAmount) - fee) * currentRate).toFixed(2) 
    : '0.00';

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
          <Text style={[styles.title, { color: colors.text }]}>International Transfer</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Card style={styles.exchangeCard}>
              <View style={styles.exchangeRow}>
                <View style={styles.exchangeColumn}>
                  <Text style={[styles.exchangeLabel, { color: colors.textSecondary }]}>You Send</Text>
                  <View style={styles.amountRow}>
                    <Text style={[styles.currencyCode, { color: colors.text }]}>GHS</Text>
                    <Input
                      placeholder="0.00"
                      value={sendAmount}
                      onChangeText={setSendAmount}
                      keyboardType="decimal-pad"
                      containerStyle={{ flex: 1, marginBottom: 0 }}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.exchangeIndicator}>
                <View style={[styles.exchangeLine, { backgroundColor: colors.border }]} />
                <View style={[styles.exchangeIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
                </View>
                <View style={[styles.exchangeLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.exchangeRow}>
                <View style={styles.exchangeColumn}>
                  <Text style={[styles.exchangeLabel, { color: colors.textSecondary }]}>They Receive</Text>
                  <View style={styles.amountRow}>
                    <Text style={[styles.currencyCode, { color: colors.text }]}>{selectedCountry.currency}</Text>
                    <Text style={[styles.receiveAmount, { color: colors.text }]}>{receiveAmount}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.rateInfo, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="information-circle" size={16} color={colors.primary} />
                <Text style={[styles.rateText, { color: colors.textSecondary }]}>
                  1 GHS = {currentRate} {selectedCountry.currency} • Fee: GHS {fee}
                </Text>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Destination Country</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {countries.map((country: { code: string; name: string; flag: string; currency: string }) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedCountry.code === country.code && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                  ]}
                  onPress={() => setSelectedCountry(country)}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={[styles.countryName, { color: colors.text }]}>{country.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pay With</Text>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  selectedPaymentMethod === method.id && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                {method.logo ? (
                  <Image source={method.logo} style={styles.paymentMethodLogoImage} resizeMode="contain" />
                ) : (
                  <View style={[styles.paymentMethodIcon, { backgroundColor: method.id === 'wallet' ? colors.primary + '15' : (method.color || colors.primary) + '15' }]}>
                    <Ionicons name={method.icon as any} size={20} color={method.id === 'wallet' ? colors.primary : method.color} />
                  </View>
                )}
                <View style={styles.paymentMethodInfo}>
                  <Text style={[styles.paymentMethodName, { color: colors.text }]}>{method.name}</Text>
                  {method.id === 'wallet' && (
                    <Text style={[styles.paymentMethodBalance, { color: colors.textSecondary }]}>
                      Balance: GHS {method.balance?.toFixed(2)}
                    </Text>
                  )}
                </View>
                {selectedPaymentMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recipient Details</Text>
            <Input
              label="Full Name"
              placeholder="Enter recipient's full name"
              value={recipientName}
              onChangeText={setRecipientName}
              leftIcon="person-outline"
            />
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <Button
              title="Continue"
              onPress={handleContinue}
              fullWidth
              size="lg"
              icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
              iconPosition="right"
            />
          </Animated.View>

          <View style={{ height: 100 }} />
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
  exchangeCard: {
    marginBottom: Spacing.lg,
  },
  exchangeRow: {
    paddingVertical: Spacing.sm,
  },
  exchangeColumn: {},
  exchangeLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyCode: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginRight: Spacing.sm,
  },
  receiveAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  exchangeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  exchangeLine: {
    flex: 1,
    height: 1,
  },
  exchangeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  rateText: {
    fontSize: FontSize.sm,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  countryName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  paymentMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  paymentMethodBalance: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  paymentMethodLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: Spacing.md,
  },
});

export default RemittanceScreen;
