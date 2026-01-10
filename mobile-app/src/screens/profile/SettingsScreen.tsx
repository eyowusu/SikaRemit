import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, themeMode, setThemeMode, isDark } = useTheme();

  const [notifications, setNotifications] = React.useState(true);
  const [biometrics, setBiometrics] = React.useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
          <Card padding="none">
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  {themeMode === 'system' ? 'System' : isDark ? 'On' : 'Off'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>
          <Card padding="none">
            <View style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warning + '10' }]}>
                <Ionicons name="notifications" size={22} color={colors.warning} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  Receive transaction alerts
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: colors.success + '10' }]}>
                <Ionicons name="mail" size={22} color={colors.success} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Email Notifications</Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  Receive email updates
                </Text>
              </View>
              <Switch
                value={true}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security</Text>
          <Card padding="none">
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: colors.error + '10' }]}>
                <Ionicons name="finger-print" size={22} color={colors.error} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Biometric Login</Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  Use fingerprint or Face ID
                </Text>
              </View>
              <Switch
                value={biometrics}
                onValueChange={setBiometrics}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
          <Card padding="none">
            <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="document-text" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, flex: 1 }]}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="shield" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, flex: 1 }]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="information-circle" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, flex: 1 }]}>Version</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>1.0.0</Text>
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
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  settingDescription: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
});

export default SettingsScreen;
