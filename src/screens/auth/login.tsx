import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Dummy credentials ────────────────────────────────────────────────────────
const DUMMY_USERS = [
  { email: 'owner@rentalmeet.com',  password: 'owner123',  name: 'Alex Johnson', userType: 'owner'  },
  { email: 'client@rentalmeet.com', password: 'client123', name: 'Sara Patel',   userType: 'client' },
];

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; userType: string }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [emailFocused, setEmailF]   = useState(false);
  const [passFocused, setPassF]     = useState(false);
  const [error, setError]           = useState('');

  // ── Animation refs ──────────────────────────────────────────────────────────
  const logoAnim    = useRef(new Animated.Value(0)).current;
  const cardAnim    = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(cardAnim,    { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const shakeCard = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      shakeCard();
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    setLoading(true);

    // Simulate network delay
    //await new Promise((res) => setTimeout(res, 900));

    const user = DUMMY_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    setLoading(false);

    if (user) {
      onLogin({ name: user.name, email: user.email, userType: user.userType });
    } else {
      setError('Incorrect email or password. Try the hints below.');
      shakeCard();
    }
  };

  const fillDummy = (type: 'owner' | 'client') => {
    const u = DUMMY_USERS.find((d) => d.userType === type)!;
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Decorative background arcs ── */}
        <View style={styles.arcTop} />
        <View style={styles.arcBottom} />

        {/* ── Logo area ── */}
        <Animated.View style={[styles.logoArea, { opacity: logoAnim, transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View style={styles.logoCard}>
            <Image
              source={require('../../assets/logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandRental}>Rental</Text>
            <Text style={styles.brandMeet}>Meet</Text>
          </View>
          <Text style={styles.brandTagline}>BOOK YOUR PREMIUM MEETING VENUES</Text>
        </Animated.View>

        {/* ── Login card ── */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [
                { translateY: cardAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue</Text>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={15} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Email field ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailFocused ? Colors.primary : Colors.charcoalLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.charcoalLight}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                onFocus={() => setEmailF(true)}
                onBlur={() => setEmailF(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* ── Password field ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputRow, passFocused && styles.inputRowFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passFocused ? Colors.primary : Colors.charcoalLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.charcoalLight}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                onFocus={() => setPassF(true)}
                onBlur={() => setPassF(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.charcoalLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotRow} onPress={() => Alert.alert('Reset Password', 'A reset link has been sent.')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* ── Login button ── */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <LoadingDots />
                </View>
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <View style={styles.loginBtnArrow}>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>quick fill</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Dummy credential hint pills ── */}
          <View style={styles.hintRow}>
            <TouchableOpacity style={styles.hintPill} onPress={() => fillDummy('owner')} activeOpacity={0.75}>
              <Ionicons name="business-outline" size={14} color={Colors.primary} />
              <View>
                <Text style={styles.hintPillLabel}>Space Owner</Text>
                <Text style={styles.hintPillCred}>owner@rentalmeet.com</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hintPill} onPress={() => fillDummy('client')} activeOpacity={0.75}>
              <Ionicons name="person-outline" size={14} color={Colors.info} />
              <View>
                <Text style={[styles.hintPillLabel, { color: Colors.info }]}>Client</Text>
                <Text style={styles.hintPillCred}>client@rentalmeet.com</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Sign up nudge ── */}
        <Animated.View style={[styles.signupRow, { opacity: cardOpacity }]}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => Alert.alert('Sign Up', 'Registration coming soon!')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.version}>RentalMeet v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Small animated loading dots ─────────────────────────────────────────────
function LoadingDots() {
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dots  = [dot0, dot1, dot2];

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 280, useNativeDriver: true }),
        ])
      );
    dots.forEach((d, i) => pulse(d, i * 140).start());
    return () => dots.forEach((d) => d.stopAnimation());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 4,
            backgroundColor: Colors.white,
            transform: [{ translateY: d }],
          }}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scrollContent:{ flexGrow: 1, alignItems: 'center', paddingBottom: Spacing.xxl, paddingTop: 0 },

  // Decorative arcs
  arcTop: {
    position: 'absolute', top: -SCREEN_WIDTH * 0.5, left: -SCREEN_WIDTH * 0.5,
    width: SCREEN_WIDTH * 1, height: SCREEN_WIDTH * 1,
    borderRadius: SCREEN_WIDTH * 0.5,
    backgroundColor: Colors.primaryLight,
    opacity: 0.6,
  },
  arcBottom: {
    position: 'absolute', bottom: -SCREEN_WIDTH * 0.4, right: -SCREEN_WIDTH * 0.4,
    width: SCREEN_WIDTH * 0.8, height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: Colors.primaryLight,
    opacity: 0.4,
  },

  // Logo area
  logoArea:     { alignItems: 'center', paddingTop: SCREEN_HEIGHT * 0.09, marginBottom: Spacing.xxl },
  logoCard:     { width: 110, height: 110, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  logo:         { width: '100%', height: '100%' },
  brandRow:     { flexDirection: 'row', alignItems: 'baseline' },
  brandRental:  { fontSize: 32, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: -0.5 },
  brandMeet:    { fontSize: 32, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.5 },
  brandTagline: { fontSize: 9, fontWeight: Typography.bold, color: Colors.charcoalLight, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },

  // Card
  card: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl,
    padding: Spacing.xl,
    ...Shadows.header,
  },
  cardTitle:    { fontSize: 24, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.4, marginBottom: 4 },
  cardSubtitle: { fontSize: Typography.md, color: Colors.charcoalLight, fontWeight: Typography.regular, marginBottom: Spacing.lg },

  // Error
  errorBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: Radii.md, padding: 12, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.danger },
  errorText:    { flex: 1, fontSize: 12, color: Colors.danger, fontWeight: Typography.semiBold, lineHeight: 17 },

  // Fields
  fieldWrap:         { marginBottom: Spacing.md },
  fieldLabel:        { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoalMid, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  inputRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radii.md, borderWidth: 1.5, borderColor: Colors.border, height: 52, paddingHorizontal: Spacing.md },
  inputRowFocused:   { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '55' },
  inputIcon:         { marginRight: Spacing.sm },
  input:             { flex: 1, fontSize: 15, color: Colors.charcoal, fontWeight: Typography.regular },
  eyeBtn:            { padding: 4 },

  // Forgot
  forgotRow:    { alignItems: 'flex-end', marginBottom: Spacing.lg, marginTop: -4 },
  forgotText:   { fontSize: 13, color: Colors.primary, fontWeight: Typography.bold },

  // Login button
  loginBtn:         { backgroundColor: Colors.charcoal, borderRadius: Radii.md, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, ...Shadows.floating },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText:     { fontSize: 16, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: 0.3 },
  loginBtnArrow:    { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  loadingRow:        { alignItems: 'center', justifyContent: 'center', height: 24 },

  // Divider
  dividerRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.lg },
  dividerLine:  { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText:  { fontSize: 10, fontWeight: Typography.bold, color: Colors.charcoalLight, letterSpacing: 1.5, textTransform: 'uppercase' },

  // Hint pills
  hintRow:      { flexDirection: 'row', gap: Spacing.sm },
  hintPill:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: Radii.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.primaryBorder },
  hintPillLabel:{ fontSize: 11, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 0.2 },
  hintPillCred: { fontSize: 9.5, color: Colors.charcoalLight, fontWeight: Typography.medium, marginTop: 1 },

  // Sign up
  signupRow:    { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl },
  signupText:   { fontSize: 14, color: Colors.charcoalLight, fontWeight: Typography.regular },
  signupLink:   { fontSize: 14, color: Colors.primary, fontWeight: Typography.extraBold },

  version:      { marginTop: Spacing.lg, fontSize: 11, color: Colors.border, fontWeight: Typography.medium },
});