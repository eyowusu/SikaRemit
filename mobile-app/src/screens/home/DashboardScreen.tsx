import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Card, SkeletonBalanceCard, SkeletonQuickActions, SkeletonInsights, SkeletonTransaction } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '../../constants/theme';
import { Transaction, Wallet } from '../../types';

const { width } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { wallets, transactions, fetchWallets, fetchTransactions, isLoading } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWallets();
    fetchTransactions(50); // Fetch more transactions for accurate monthly insights
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWallets(), fetchTransactions(5)]);
    setRefreshing(false);
  };

  const quickActions = [
    { icon: 'add-circle', label: 'Deposit', color: '#10B981', screen: 'Deposit' },
    { icon: 'send', label: 'Send Local', color: '#7C3AED', screen: 'SendMoney' },
    { icon: 'phone-portrait', label: 'Airtime', color: '#F59E0B', screen: 'Airtime' },
    { icon: 'cellular', label: 'Data', color: '#06B6D4', screen: 'DataBundle' },
    { icon: 'receipt', label: 'Bills', color: '#EC4899', screen: 'BillPayment' },
    { icon: 'globe', label: 'Remit', color: '#8B5CF6', screen: 'Remittance' },
    { icon: 'download', label: 'Request', color: '#EF4444', screen: 'RequestMoney' },
    { icon: 'qr-code', label: 'QR Pay', color: '#3B82F6', screen: 'QRScanner' },
  ];

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Calculate spending insights from transactions
  const spendingInsights = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    let totalSpent = 0;
    let totalReceived = 0;
    let transactionCount = 0;
    
    transactions.forEach((t: Transaction) => {
      const txDate = new Date(t.created_at);
      if (txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear) {
        transactionCount++;
        if (t.type === 'send' || t.type === 'bill_payment' || t.type === 'remittance') {
          totalSpent += t.amount;
        } else if (t.type === 'receive') {
          totalReceived += t.amount;
        }
      }
    });
    
    return { totalSpent, totalReceived, transactionCount };
  }, [transactions]);

  // Currency flag mapping
  const getCurrencyFlag = (currency: string) => {
    const flags: Record<string, string> = {
      GHS: '🇬🇭',
      USD: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      NGN: '🇳🇬',
      KES: '🇰🇪',
    };
    return flags[currency] || '💰';
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return 'arrow-up-circle';
      case 'receive': return 'arrow-down-circle';
      case 'bill_payment': return 'receipt';
      case 'remittance': return 'globe';
      default: return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send': return colors.error;
      case 'receive': return colors.success;
      default: return colors.primary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.first_name || 'User'} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={[styles.notificationBadge, { backgroundColor: colors.error }]} />
          </TouchableOpacity>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity style={styles.eyeButton} onPress={() => setBalanceVisible(!balanceVisible)}>
                <Ionicons name={balanceVisible ? "eye-outline" : "eye-off-outline"} size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {balanceVisible ? `GHS ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
            </Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceChange}>
                <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.balanceChangeText}>{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity 
                style={styles.addMoneyButton}
                onPress={() => navigation.navigate('Payments', { screen: 'Deposit' })}
              >
                <Ionicons name="add" size={18} color="#8B5CF6" />
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Individual Wallets */}
        {wallets.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>My Wallets</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { color: colors.primary }]}>Manage</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletsScroll}>
              {wallets.map((wallet: Wallet, index: number) => (
                <Animated.View 
                  key={wallet.id} 
                  entering={FadeInRight.delay(100 * index).duration(400)}
                >
                  <TouchableOpacity 
                    style={[styles.walletCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.walletHeader}>
                      <Text style={styles.walletFlag}>{getCurrencyFlag(wallet.currency)}</Text>
                      <View style={[styles.walletBadge, wallet.is_default && { backgroundColor: colors.primary + '20' }]}>
                        {wallet.is_default && (
                          <Text style={[styles.walletBadgeText, { color: colors.primary }]}>Primary</Text>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.walletCurrency, { color: colors.textSecondary }]}>{wallet.currency} Wallet</Text>
                    <Text style={[styles.walletBalance, { color: colors.text }]}>
                      {balanceVisible 
                        ? `${wallet.currency} ${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : '••••••'
                      }
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
              <TouchableOpacity 
                style={[styles.addWalletCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Payments', { screen: 'Deposit' })}
              >
                <View style={[styles.addWalletIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="add" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.addWalletText, { color: colors.textSecondary }]}>Add Wallet</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* Monthly Insights */}
        <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>This Month</Text>
          <View style={styles.insightsRow}>
            <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.insightIconContainer, { backgroundColor: '#10B981' + '15' }]}>
                <Ionicons name="arrow-down-circle" size={20} color="#10B981" />
              </View>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Received</Text>
              <Text style={[styles.insightAmount, { color: '#10B981' }]}>
                {balanceVisible ? `+GHS ${spendingInsights.totalReceived.toLocaleString()}` : '••••'}
              </Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.insightIconContainer, { backgroundColor: '#EF4444' + '15' }]}>
                <Ionicons name="arrow-up-circle" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Spent</Text>
              <Text style={[styles.insightAmount, { color: '#EF4444' }]}>
                {balanceVisible ? `-GHS ${spendingInsights.totalSpent.toLocaleString()}` : '••••'}
              </Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.insightIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Transactions</Text>
              <Text style={[styles.insightAmount, { color: colors.primary }]}>
                {spendingInsights.transactionCount}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionItem}
                onPress={() => navigation.navigate('Payments', { screen: action.screen })}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Your recent transactions will appear here
              </Text>
            </Card>
          ) : (
            <Card padding="none">
              {transactions.slice(0, 5).map((transaction: Transaction, index: number) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={[
                    styles.transactionItem,
                    index < transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  ]}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.type) + '15' }]}>
                    <Ionicons
                      name={getTransactionIcon(transaction.type) as any}
                      size={20}
                      color={getTransactionColor(transaction.type)}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionTitle, { color: colors.text }]}>
                      {transaction.recipient?.name || transaction.sender?.name || transaction.description || 'Transaction'}
                    </Text>
                    <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'receive' ? colors.success : colors.text },
                    ]}
                  >
                    {transaction.type === 'receive' ? '+' : '-'}
                    {transaction.currency} {transaction.amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}
        </Animated.View>

        {/* Promo Banner */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <Card variant="gradient" padding="lg">
            <View style={styles.promoBanner}>
              <View style={styles.promoContent}>
                <Text style={styles.promoTitle}>Invite Friends & Earn</Text>
                <Text style={styles.promoSubtitle}>
                  Get GHS 50 for every friend who signs up and makes their first transaction
                </Text>
                <TouchableOpacity style={styles.promoButton}>
                  <Text style={styles.promoButtonText}>Invite Now</Text>
                </TouchableOpacity>
              </View>
              <Ionicons name="gift" size={64} color="rgba(255,255,255,0.3)" />
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
  content: {
    paddingHorizontal: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.sm,
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  balanceCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.glow,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginVertical: Spacing.md,
    letterSpacing: -1,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  balanceChangeText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addMoneyText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#6366F1',
  },
  walletsScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  walletCard: {
    width: 150,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  walletFlag: {
    fontSize: 22,
  },
  walletBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  walletBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  walletCurrency: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  walletBalance: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  addWalletCard: {
    width: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWalletIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addWalletText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  insightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  insightCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  insightLabel: {
    fontSize: FontSize.xs,
    marginBottom: 2,
  },
  insightAmount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
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
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - Spacing.md * 2 - Spacing.sm * 3) / 4,
    marginBottom: Spacing.md,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  emptyCard: {
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  transactionDate: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  promoSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  promoButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#7C3AED',
  },
});

export default DashboardScreen;
