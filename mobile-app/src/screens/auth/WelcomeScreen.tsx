import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="globe-outline" size={48} color="#7C3AED" />
            </View>
            <Text style={styles.logoText}>SikaRemit</Text>
            <Text style={styles.tagline}>Financial Technology</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Secure Payments{'\n'}for the Digital Age
            </Text>
            <Text style={styles.heroSubtitle}>
              Send money, pay bills, and manage your finances with ease. Fast, secure, and reliable.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="flash" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Instant Transfers</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Bank-Grade Security</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="globe" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Global Remittance</Text>
            </View>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(800).duration(800)} 
            style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}
          >
            <Button
              title="Get Started"
              onPress={() => navigation.navigate('Register')}
              size="lg"
              fullWidth
              style={styles.primaryButton}
              gradient={false}
            />
            <Button
              title="I already have an account"
              variant="ghost"
              onPress={() => navigation.navigate('Login')}
              size="lg"
              fullWidth
              style={styles.secondaryButton}
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  heroTitle: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 48,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 24,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default WelcomeScreen;
