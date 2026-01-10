import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList, HomeStackParamList, PaymentsStackParamList, ProfileStackParamList } from '../types';

import DashboardScreen from '../screens/home/DashboardScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import PaymentsHomeScreen from '../screens/payments/PaymentsHomeScreen';
import SendMoneyScreen from '../screens/payments/SendMoneyScreen';
import BillPaymentScreen from '../screens/payments/BillPaymentScreen';
import RemittanceScreen from '../screens/payments/RemittanceScreen';
import AirtimeScreen from '../screens/payments/AirtimeScreen';
import DataBundleScreen from '../screens/payments/DataBundleScreen';
import DepositScreen from '../screens/payments/DepositScreen';
import TransactionHistoryScreen from '../screens/transactions/TransactionHistoryScreen';
import ProfileHomeScreen from '../screens/profile/ProfileHomeScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import KYCVerificationScreen from '../screens/profile/KYCVerificationScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const PaymentsStack = createNativeStackNavigator<PaymentsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const HomeNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
    <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
  </HomeStack.Navigator>
);

const PaymentsNavigator = () => (
  <PaymentsStack.Navigator screenOptions={{ headerShown: false }}>
    <PaymentsStack.Screen name="PaymentsHome" component={PaymentsHomeScreen} />
    <PaymentsStack.Screen name="SendMoney" component={SendMoneyScreen} />
    <PaymentsStack.Screen name="BillPayment" component={BillPaymentScreen} />
    <PaymentsStack.Screen name="Remittance" component={RemittanceScreen} />
    <PaymentsStack.Screen name="Airtime" component={AirtimeScreen} />
    <PaymentsStack.Screen name="DataBundle" component={DataBundleScreen} />
    <PaymentsStack.Screen name="Deposit" component={DepositScreen} />
  </PaymentsStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileHomeScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="Security" component={SecurityScreen} />
    <ProfileStack.Screen name="KYCVerification" component={KYCVerificationScreen} />
  </ProfileStack.Navigator>
);

const MainNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Payments':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark ? colors.surface + 'F0' : colors.background + 'F0',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Payments" component={PaymentsNavigator} />
      <Tab.Screen name="History" component={TransactionHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainNavigator;
