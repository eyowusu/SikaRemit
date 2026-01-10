import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useWalletStore } from '../../store/walletStore';
import { Transaction } from '../../types';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

const TransactionHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { transactions, fetchTransactions, isLoading } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'bills'>('all');

  useEffect(() => {
    fetchTransactions(50);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(50);
    setRefreshing(false);
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'send', label: 'Sent' },
    { key: 'receive', label: 'Received' },
    { key: 'bills', label: 'Bills' },
  ];

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'bills') return t.type === 'bill_payment';
    return t.type === filter;
  });

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

  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
      <TouchableOpacity
        style={[styles.transactionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '15' }]}>
          <Ionicons
            name={getTransactionIcon(item.type) as any}
            size={24}
            color={getTransactionColor(item.type)}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>
            {item.recipient?.name || item.sender?.name || item.description || 'Transaction'}
          </Text>
          <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text
            style={[
              styles.transactionAmount,
              { color: item.type === 'receive' ? colors.success : colors.text },
            ]}
          >
            {item.type === 'receive' ? '+' : '-'}{item.currency} {item.amount.toLocaleString()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? colors.success + '20' : colors.warning + '20' }]}>
            <Text style={[styles.statusText, { color: item.status === 'completed' ? colors.success : colors.warning }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Transaction History</Text>
      </View>

      <View style={styles.filtersContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterButton,
              { backgroundColor: colors.surface },
              filter === f.key && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter(f.key as any)}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.textSecondary },
                filter === f.key && { color: '#FFFFFF' },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Your transaction history will appear here
            </Text>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'capitalize',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

export default TransactionHistoryScreen;
