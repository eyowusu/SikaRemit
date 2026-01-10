import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

const ProfileHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' },
    { icon: 'shield-checkmark-outline', label: 'KYC Verification', screen: 'KYCVerification', badge: user?.kyc_status !== 'approved' },
    { icon: 'card-outline', label: 'Payment Methods', screen: 'PaymentMethods' },
    { icon: 'lock-closed-outline', label: 'Security', screen: 'Security' },
    { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
    { icon: 'help-circle-outline', label: 'Help & Support', screen: 'Support' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const getKYCStatusColor = () => {
    switch (user?.kyc_status) {
      case 'approved': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.error;
      default: return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.first_name?.charAt(0) || 'U'}{user?.last_name?.charAt(0) || ''}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: user?.is_verified ? colors.success + '20' : colors.warning + '20' }]}>
              <Ionicons
                name={user?.is_verified ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={user?.is_verified ? colors.success : colors.warning}
              />
              <Text style={[styles.badgeText, { color: user?.is_verified ? colors.success : colors.warning }]}>
                {user?.is_verified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getKYCStatusColor() + '20' }]}>
              <Text style={[styles.badgeText, { color: getKYCStatusColor() }]}>
                KYC: {user?.kyc_status || 'Not Submitted'}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Card padding="none">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                ]}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <View style={[styles.menuBadge, { backgroundColor: colors.warning }]}>
                      <Text style={styles.menuBadgeText}>!</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.logoutSection}>
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.error }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.version, { color: colors.textMuted }]}>
          SikaRemit v1.0.0
        </Text>

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
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'capitalize',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  logoutSection: {
    marginTop: Spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    marginTop: Spacing.lg,
  },
});

export default ProfileHomeScreen;
