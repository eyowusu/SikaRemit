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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { paymentService } from '../../services/paymentService';
import exchangeRateService from '../../services/exchangeRateService';

interface RemittanceConfirmParams {
  sendAmount: number;
  receiveAmount: number;
  fee: number;
  exchangeRate: number;
  sourceCurrency: string;
  targetCurrency: string;
  recipientName: string;
  recipientPhone: string;
  recipientCountry: string;
  countryFlag: string;
  paymentMethod: string;
}

type RemittanceConfirmRouteProp = RouteProp<{ RemittanceConfirm: RemittanceConfirmParams }, 'RemittanceConfirm'>;

const RemittanceConfirmScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RemittanceConfirmRouteProp>();
  const { colors } = useTheme();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const {
    sendAmount,
    receiveAmount,
    fee,
    exchangeRate,
    sourceCurrency,
    targetCurrency,
    recipientName,
    recipientPhone,
    recipientCountry,
    countryFlag,
    paymentMethod,
  } = route.params;

  const totalAmount = sendAmount + fee;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const response = await paymentService.sendRemittance({
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_country: recipientCountry,
        amount: sendAmount,
        source_currency: sourceCurrency,
        target_currency: targetCurrency,
        exchange_rate: exchangeRate,
        fee: fee,
        payment_method: paymentMethod,
      });

      setTransactionId(response.id);
      setShowSuccess(true);
    } catch (error: any) {
      Alert.alert(
        'Transfer Failed',
        error.response?.data?.message || 'Failed to process your transfer. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    navigation.navigate('Home', { screen: 'Dashboard' });
  };

  const handleViewReceipt = () => {
    if (transactionId) {
      navigation.navigate('TransactionReceipt', { transactionId });
    }
  };

  if (showSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successContainer, { paddingTop: insets.top + Spacing.xl }]}>
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>Transfer Successful!</Text>
            <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
              Your money is on its way to {recipientName}
            </Text>

            <Card style={styles.successCard}>
              <View style={styles.successRow}>
                <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Amount Sent</Text>
                <Text style={[styles.successValue, { color: colors.text }]}>
                  {exchangeRateService.formatAmount(sendAmount, sourceCurrency)}
                </Text>
              </View>
              <View style={[styles.successRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Recipient Gets</Text>
                <Text style={[styles.successValue, { color: colors.success }]}>
                  {exchangeRateService.formatAmount(receiveAmount, targetCurrency)}
                </Text>
              </View>
              <View style={[styles.successRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
                <Text style={[styles.successValue, { color: colors.primary }]}>
                  {transactionId?.slice(0, 12)}...
                </Text>
              </View>
              <View style={[styles.successRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Estimated Delivery</Text>
                <Text style={[styles.successValue, { color: colors.text }]}>Within 24 hours</Text>
              </View>
            </Card>

            <View style={styles.successActions}>
              <Button
                title="View Receipt"
                onPress={handleViewReceipt}
                variant="outline"
                fullWidth
                icon={<Ionicons name="receipt-outline" size={20} color={colors.primary} />}
              />
              <View style={{ height: Spacing.md }} />
              <Button
                title="Done"
                onPress={handleDone}
                fullWidth
                icon={<Ionicons name="checkmark" size={20} color="#FFFFFF" />}
              />
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Confirm Transfer</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Transfer Summary */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>You're sending</Text>
              <Text style={styles.summaryAmount}>
                {exchangeRateService.formatAmount(sendAmount, sourceCurrency)}
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-down" size={24} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={styles.summaryFooter}>
              <Text style={styles.summaryLabel}>{recipientName} receives</Text>
              <Text style={styles.summaryAmount}>
                {exchangeRateService.formatAmount(receiveAmount, targetCurrency)}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Recipient Details */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recipient Details</Text>
          <Card>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Name</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{recipientName}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
              <View style={styles.detailIcon}>
                <Ionicons name="call" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{recipientPhone}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
              <View style={styles.detailIcon}>
                <Text style={{ fontSize: 20 }}>{countryFlag}</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Country</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{recipientCountry}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Transfer Details */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transfer Details</Text>
          <Card>
            <View style={styles.detailRow}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Send Amount</Text>
              <Text style={[styles.feeValue, { color: colors.text }]}>
                {exchangeRateService.formatAmount(sendAmount, sourceCurrency)}
              </Text>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Exchange Rate</Text>
              <Text style={[styles.feeValue, { color: colors.text }]}>
                1 {sourceCurrency} = {exchangeRate.toFixed(4)} {targetCurrency}
              </Text>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Transfer Fee</Text>
              <Text style={[styles.feeValue, { color: colors.text }]}>
                {exchangeRateService.formatAmount(fee, sourceCurrency)}
              </Text>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
              <Text style={[styles.feeLabel, { color: colors.text, fontWeight: FontWeight.semibold }]}>
                Total to Pay
              </Text>
              <Text style={[styles.feeValue, { color: colors.primary, fontWeight: FontWeight.bold }]}>
                {exchangeRateService.formatAmount(totalAmount, sourceCurrency)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Payment Method */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <Card>
            <View style={styles.paymentMethodRow}>
              <View style={[styles.paymentIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons 
                  name={paymentMethod === 'wallet' ? 'wallet' : paymentMethod.includes('card') ? 'card' : 'phone-portrait'} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              <Text style={[styles.paymentMethodText, { color: colors.text }]}>
                {paymentMethod === 'wallet' ? 'SikaRemit Balance' : 
                 paymentMethod === 'card' ? 'Debit/Credit Card' :
                 paymentMethod.includes('mtn') ? 'MTN Mobile Money' :
                 paymentMethod.includes('telecel') ? 'Telecel Cash' : 'Mobile Money'}
              </Text>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </View>
          </Card>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <View style={[styles.disclaimer, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={[styles.disclaimerText, { color: colors.warning }]}>
              By confirming, you agree to our terms and conditions. The recipient will receive the funds within 24 hours.
            </Text>
          </View>
        </Animated.View>

        {/* Confirm Button */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Button
            title="Confirm & Send"
            onPress={handleConfirm}
            loading={isSubmitting}
            fullWidth
            size="lg"
            icon={<Ionicons name="send" size={20} color="#FFFFFF" />}
          />
        </Animated.View>

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
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  summaryFooter: {
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  feeLabel: {
    fontSize: FontSize.md,
    flex: 1,
  },
  feeValue: {
    fontSize: FontSize.md,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  paymentMethodText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  disclaimer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  disclaimerText: {
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  successCard: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  successLabel: {
    fontSize: FontSize.md,
  },
  successValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  successActions: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
});

export default RemittanceConfirmScreen;
