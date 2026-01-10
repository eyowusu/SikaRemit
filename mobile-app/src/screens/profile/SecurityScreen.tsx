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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Card, Input } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { authService } from '../../services/authService';

const SecurityScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, biometricEnabled, setBiometricEnabled } = useAuthStore();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error.response?.data?.message || 
                      error.response?.data?.detail ||
                      'Failed to change password. Please check your current password.';
      Alert.alert('Error', message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Security</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Card>
            <View style={styles.securityItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="shield-checkmark" size={28} color={colors.success} />
              </View>
              <View style={styles.securityContent}>
                <Text style={[styles.securityTitle, { color: colors.text }]}>Account Security</Text>
                <Text style={[styles.securityDescription, { color: colors.textSecondary }]}>
                  Your account is protected with email verification
                  {user?.mfa_enabled && ' and two-factor authentication'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Authentication</Text>
          <Card padding="none">
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}
              onPress={() => setShowPasswordForm(!showPasswordForm)}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="key" size={22} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Change Password</Text>
                <Text style={[styles.menuDescription, { color: colors.textMuted }]}>
                  Update your account password
                </Text>
              </View>
              <Ionicons
                name={showPasswordForm ? 'chevron-up' : 'chevron-forward'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {showPasswordForm && (
              <View style={styles.passwordForm}>
                <Input
                  label="Current Password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <Input
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <Button title="Update Password" onPress={handleChangePassword} fullWidth />
              </View>
            )}

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: colors.warning + '10' }]}>
                <Ionicons name="phone-portrait" size={22} color={colors.warning} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Two-Factor Authentication</Text>
                <Text style={[styles.menuDescription, { color: colors.textMuted }]}>
                  {user?.mfa_enabled ? 'Enabled' : 'Add extra security to your account'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: user?.mfa_enabled ? colors.success + '20' : colors.surfaceVariant }]}>
                <Text style={[styles.statusText, { color: user?.mfa_enabled ? colors.success : colors.textMuted }]}>
                  {user?.mfa_enabled ? 'On' : 'Off'}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Biometrics</Text>
          <Card padding="none">
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setBiometricEnabled(!biometricEnabled)}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary + '10' }]}>
                <Ionicons name="finger-print" size={22} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Biometric Login</Text>
                <Text style={[styles.menuDescription, { color: colors.textMuted }]}>
                  Use fingerprint or Face ID to login
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: biometricEnabled ? colors.success + '20' : colors.surfaceVariant }]}>
                <Text style={[styles.statusText, { color: biometricEnabled ? colors.success : colors.textMuted }]}>
                  {biometricEnabled ? 'On' : 'Off'}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sessions</Text>
          <Card>
            <View style={styles.sessionItem}>
              <View style={[styles.sessionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="phone-portrait" size={20} color={colors.primary} />
              </View>
              <View style={styles.sessionContent}>
                <Text style={[styles.sessionDevice, { color: colors.text }]}>This Device</Text>
                <Text style={[styles.sessionInfo, { color: colors.textMuted }]}>
                  Active now • Windows 11
                </Text>
              </View>
              <View style={[styles.activeBadge, { backgroundColor: colors.success }]} />
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
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
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
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  menuDescription: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  passwordForm: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sessionContent: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  sessionInfo: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  activeBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default SecurityScreen;
