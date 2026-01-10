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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Input, Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useWalletStore } from '../../store/walletStore';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { TelecomLogos, detectTelecom } from '../../assets/logos';
import mobileMoneyService, { MobileMoneyNetwork } from '../../services/mobileMoneyService';

interface DataPackage {
  id: string;
  name: string;
  data: string;
  validity: string;
  price: number;
}

const DataBundleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { wallets } = useWalletStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<DataPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('wallet');
  const [isLoading, setIsLoading] = useState(false);

  const walletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const paymentMethods = [
    { id: 'wallet', name: 'SikaRemit Balance', icon: 'wallet', balance: walletBalance },
    { id: 'mtn_momo', name: 'MTN Mobile Money', icon: 'phone-portrait', color: '#FFCC00', logo: TelecomLogos.mtn },
    { id: 'telecel_cash', name: 'Telecel Cash', icon: 'phone-portrait', color: '#E60000', logo: TelecomLogos.telecel },
    { id: 'airteltigo_money', name: 'AirtelTigo Money', icon: 'phone-portrait', color: '#FF0000', logo: TelecomLogos.airteltigo },
  ];

  const networks = [
    { id: 'mtn', name: 'MTN', color: '#FFCC00', logo: TelecomLogos.mtn },
    { id: 'telecel', name: 'Telecel', color: '#E60000', logo: TelecomLogos.telecel },
    { id: 'airteltigo', name: 'AirtelTigo', color: '#FF0000', logo: TelecomLogos.airteltigo },
  ];

  const dataPackages: Record<string, DataPackage[]> = {
    mtn: [
      { id: 'mtn_1', name: 'Daily', data: '100MB', validity: '1 Day', price: 1 },
      { id: 'mtn_2', name: 'Weekly', data: '1GB', validity: '7 Days', price: 5 },
      { id: 'mtn_3', name: 'Monthly', data: '5GB', validity: '30 Days', price: 20 },
      { id: 'mtn_4', name: 'Monthly Plus', data: '10GB', validity: '30 Days', price: 35 },
    ],
    telecel: [
      { id: 'telecel_1', name: 'Daily', data: '100MB', validity: '1 Day', price: 1 },
      { id: 'telecel_2', name: 'Weekly', data: '1GB', validity: '7 Days', price: 5 },
      { id: 'telecel_3', name: 'Monthly', data: '5GB', validity: '30 Days', price: 20 },
      { id: 'telecel_4', name: 'Monthly Plus', data: '10GB', validity: '30 Days', price: 35 },
    ],
    airteltigo: [
      { id: 'at_1', name: 'Daily', data: '100MB', validity: '1 Day', price: 1 },
      { id: 'at_2', name: 'Weekly', data: '1GB', validity: '7 Days', price: 5 },
      { id: 'at_3', name: 'Monthly', data: '5GB', validity: '30 Days', price: 20 },
      { id: 'at_4', name: 'Monthly Plus', data: '10GB', validity: '30 Days', price: 35 },
    ],
  };

  const currentPackages = selectedNetwork ? dataPackages[selectedNetwork] || [] : [];

  // Auto-detect network from phone number
  useEffect(() => {
    if (phoneNumber.length >= 3) {
      const detected = detectTelecom(phoneNumber);
      if (detected && !selectedNetwork) {
        setSelectedNetwork(detected);
      }
    }
  }, [phoneNumber]);

  
  const handlePurchase = async () => {
    if (!selectedNetwork) {
      Alert.alert('Error', 'Please select a network');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a data package');
      return;
    }

    // Validate phone number
    const validation = mobileMoneyService.validatePhone(phoneNumber);
    if (!validation.valid) {
      Alert.alert('Error', validation.message || 'Invalid phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Map network ID to MobileMoneyNetwork type
      const networkMap: Record<string, MobileMoneyNetwork> = {
        'mtn': 'mtn',
        'telecel': 'telecel',
        'airteltigo': 'airteltigo',
      };
      const network = networkMap[selectedNetwork] || 'mtn';

      // Determine payment method
      const paymentMethod = selectedPaymentMethod === 'wallet' ? 'wallet' : 'mobile_money';
      const paymentPhone = selectedPaymentMethod !== 'wallet' 
        ? phoneNumber 
        : undefined;

      // Call real API
      const response = await mobileMoneyService.buyDataBundle({
        phone: phoneNumber,
        bundleId: selectedPackage.id,
        network,
        paymentMethod,
        paymentPhone,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          response.message || `${selectedPackage.data} data bundle sent to ${phoneNumber}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to purchase data bundle');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to purchase data bundle');
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
          <Text style={[styles.title, { color: colors.text }]}>Buy Data Bundle</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Network</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.networksScroll}>
              {networks.map((network) => (
                <TouchableOpacity
                  key={network.id}
                  style={[
                    styles.networkChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedNetwork === network.id && { borderColor: network.color, backgroundColor: network.color + '15' },
                  ]}
                  onPress={() => {
                    setSelectedNetwork(network.id);
                    setSelectedPackage(null);
                  }}
                >
                  <Image source={network.logo} style={styles.networkChipLogo} resizeMode="contain" />
                  <Text style={[styles.networkChipText, { color: colors.text }]}>{network.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
          </Animated.View>

          {selectedNetwork && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Data Package</Text>
              <View style={styles.packagesGrid}>
                {currentPackages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[
                      styles.packageCard,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                      selectedPackage?.id === pkg.id && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedPackage(pkg)}
                  >
                    <Text style={[styles.packageData, { color: colors.primary }]}>{pkg.data}</Text>
                    <Text style={[styles.packageValidity, { color: colors.textSecondary }]}>
                      {pkg.validity}
                    </Text>
                    <Text style={[styles.packagePrice, { color: colors.text }]}>
                      GHS {pkg.price.toFixed(2)}
                    </Text>
                    {selectedPackage?.id === pkg.id && (
                      <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {selectedPackage && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
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
                    <View style={[styles.paymentMethodIcon, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name={method.icon as any} size={20} color={colors.primary} />
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
          )}

          {selectedPackage && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
              <Card>
                <View style={styles.summaryHeader}>
                  <Ionicons name="cellular" size={24} color={colors.primary} />
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Network</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {networks.find((n) => n.id === selectedNetwork)?.name}
                  </Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{phoneNumber || '-'}</Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Data</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedPackage.data}</Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Validity</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedPackage.validity}</Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Payment Method</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name || '-'}
                  </Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: FontWeight.semibold }]}>
                    Total
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.lg }]}>
                    GHS {selectedPackage.price.toFixed(2)}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Button
              title="Buy Data Bundle"
              onPress={handlePurchase}
              loading={isLoading}
              fullWidth
              size="lg"
              disabled={!selectedPackage}
              icon={<Ionicons name="cellular" size={20} color="#FFFFFF" />}
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  networksScroll: {
    marginBottom: Spacing.lg,
  },
  networkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  networkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
  networkChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  networkChipLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  packageCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  packageData: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  packageValidity: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  packagePrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
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

export default DataBundleScreen;
