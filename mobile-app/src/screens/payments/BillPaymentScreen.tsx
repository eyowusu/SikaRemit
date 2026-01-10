import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, Button, Input } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import billPaymentService, { BillCategory, BillProvider } from '../../services/billPaymentService';

const BillPaymentScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get categories and providers from service
  const billCategories = billPaymentService.getCategories();
  
  // Get providers for selected category from service
  const currentProviders = selectedCategory 
    ? billPaymentService.getProvidersByCategory(selectedCategory as BillCategory)
    : [];
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validatedAccount, setValidatedAccount] = useState<any | null>(null);

  const handleSelectProvider = (provider: any) => {
    setSelectedProvider(provider);
    setValidatedAccount(null);
    setAccountNumber('');
    setAmount('');
  };

  const handleValidateAccount = async () => {
    if (!accountNumber || !selectedProvider) {
      Alert.alert('Error', 'Please enter an account number');
      return;
    }

    setIsValidating(true);
    try {
      const result = await billPaymentService.validateAccount(
        selectedCategory as BillCategory,
        selectedProvider.id,
        accountNumber
      );

      if (result.valid) {
        setValidatedAccount(result);
        if ((result as any).amount) {
          setAmount((result as any).amount.toString());
        }
      } else {
        Alert.alert('Invalid Account', result.message || 'Could not validate account');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to validate account');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePayBill = async () => {
    if (!validatedAccount || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please validate account and enter amount');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await billPaymentService.payBill({
        providerId: selectedProvider.id,
        accountNumber,
        amount: parseFloat(amount),
        paymentMethod: 'wallet',
      });

      if (result.success) {
        Alert.alert(
          'Payment Successful',
          result.message || `Bill payment of GHS ${amount} completed successfully.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Payment Failed', result.message || 'Failed to process payment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process bill payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Pay Bills</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Category</Text>
          <View style={styles.categoriesGrid}>
            {billCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  selectedCategory === category.id && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                  <Ionicons name={category.icon as any} size={28} color={category.color} />
                </View>
                <Text style={[styles.categoryName, { color: colors.text }]}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {selectedCategory && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.providersSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Provider</Text>
            <Card padding="sm">
              {currentProviders.map((provider: BillProvider, index: number) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[
                    styles.providerItem,
                    index < currentProviders.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  ]}
                  onPress={() => handleSelectProvider(provider)}
                >
                  <View style={[styles.providerLogo, { backgroundColor: provider.color }]}>
                    <Text style={styles.providerLogoText}>{provider.shortName.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.providerName, { color: colors.text }]}>{provider.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Bills</Text>
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No recent bills
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Your paid bills will appear here
              </Text>
            </View>
          </Card>
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
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    width: '31%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  providersSection: {
    marginBottom: Spacing.lg,
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
  recentSection: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
});

export default BillPaymentScreen;
