import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

const PaymentsHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const paymentOptions = [
    {
      id: 'deposit',
      title: 'Deposit',
      description: 'Top up your wallet',
      icon: 'add-circle',
      color: '#10B981',
      screen: 'Deposit',
    },
    {
      id: 'send',
      title: 'Send Locally',
      description: 'Domestic transfer to friends and family',
      icon: 'send',
      color: '#7C3AED',
      screen: 'SendMoney',
    },
    {
      id: 'request',
      title: 'Request Money',
      description: 'Request payment from others',
      icon: 'download',
      color: '#EC4899',
      screen: 'RequestMoney',
    },
    {
      id: 'bills',
      title: 'Pay Bills',
      description: 'Utilities, subscriptions, and more',
      icon: 'receipt',
      color: '#06B6D4',
      screen: 'BillPayment',
    },
    {
      id: 'remittance',
      title: 'International Transfer',
      description: 'Send money across borders',
      icon: 'globe',
      color: '#10B981',
      screen: 'Remittance',
    },
    {
      id: 'airtime',
      title: 'Buy Airtime',
      description: 'Recharge mobile airtime',
      icon: 'phone-portrait',
      color: '#F59E0B',
      screen: 'Airtime',
    },
    {
      id: 'data',
      title: 'Data Bundle',
      description: 'Buy internet data packages',
      icon: 'cellular',
      color: '#06B6D4',
      screen: 'DataBundle',
    },
    {
      id: 'qr',
      title: 'QR Payment',
      description: 'Scan to pay merchants',
      icon: 'qr-code',
      color: '#8B5CF6',
      screen: 'QRScanner',
    },
  ];

  const mobileMoneyProviders = [
    { id: 'mtn', name: 'MTN MoMo', color: '#FFCC00' },
    { id: 'telecel', name: 'Telecel Cash', color: '#E60000' },
    { id: 'airteltigo', name: 'AirtelTigo', color: '#FF0000' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={[styles.title, { color: colors.text }]}>Payments</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose a payment option to get started
          </Text>
        </Animated.View>

        {/* Payment Options Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.grid}>
          {paymentOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => navigation.navigate(option.screen)}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color + '15' }]}>
                <Ionicons name={option.icon as any} size={28} color={option.color} />
              </View>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
              <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Mobile Money Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mobile Money</Text>
          <Card padding="sm">
            {mobileMoneyProviders.map((provider, index) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerItem,
                  index < mobileMoneyProviders.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                  },
                ]}
              >
                <View style={[styles.providerLogo, { backgroundColor: provider.color }]}>
                  <Text style={styles.providerLogoText}>{provider.name.charAt(0)}</Text>
                </View>
                <Text style={[styles.providerName, { color: colors.text }]}>{provider.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </Card>
        </Animated.View>

        {/* Recent Recipients - Add New Button Only */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Send</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.recipientItem}>
              <View
                style={[
                  styles.recipientAvatar,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.recipientName, { color: colors.primary }]}>
                Add New
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
  content: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  optionCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  optionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  providerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  providerLogoText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  providerName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  recipientItem: {
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  recipientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  recipientInitial: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  recipientName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});

export default PaymentsHomeScreen;
