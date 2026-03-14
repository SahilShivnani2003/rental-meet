import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Circle large enough to cover full screen from center
const CIRCLE_SIZE = Math.sqrt(width * width + height * height) * 2.1;

// ── Ripple Ring Component ─────────────────────────────────────────────────────
const RippleRing: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const scale   = useRef(new Animated.Value(0.2)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const animate = () => {
      scale.setValue(0.2);
      opacity.setValue(0.7);
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.2,
          duration: 2200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.rippleRing,
        {
          borderColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

// ── Main Splash Screen ────────────────────────────────────────────────────────
const SplashScreen: React.FC = () => {
  // Circle wipe reveal
  const circleScale   = useRef(new Animated.Value(0)).current;

  // Top badge
  const badgeY        = useRef(new Animated.Value(-120)).current;
  const badgeOpacity  = useRef(new Animated.Value(0)).current;

  // Logo
  const logoScale     = useRef(new Animated.Value(0)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;

  // Brand name — split halves
  const leftSlide     = useRef(new Animated.Value(-80)).current;
  const rightSlide    = useRef(new Animated.Value(80)).current;
  const nameOpacity   = useRef(new Animated.Value(0)).current;

  // Tagline
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const tagSlide      = useRef(new Animated.Value(18)).current;

  // Divider width
  const dividerWidth  = useRef(new Animated.Value(0)).current;

  // Bottom footer
  const footerY       = useRef(new Animated.Value(120)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // Floating logo idle bob
  const floatAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Idle float loop (starts after entrance)
    const startFloat = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Master entrance sequence
    Animated.sequence([
      // ① Full-screen orange → white circle wipe (dramatic reveal)
      Animated.timing(circleScale, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),

      // ② Badge drops from top + Logo pops in together
      Animated.parallel([
        Animated.spring(badgeY, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),

      // ③ Divider line draws across
      Animated.timing(dividerWidth, {
        toValue: width * 0.55,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // width can't use native driver
      }),

      // ④ Brand name halves slide together
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(leftSlide, {
          toValue: 0,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(rightSlide, {
          toValue: 0,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),

      // ⑤ Tagline floats up
      Animated.parallel([
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(tagSlide, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // ⑥ Footer slides up
      Animated.parallel([
        Animated.spring(footerY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => startFloat());
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={ORANGE} />

      {/* ── Full-screen orange base ── */}
      <View style={styles.orangeBase} />

      {/* ── White circle wipe from center ── */}
      <Animated.View
        style={[
          styles.revealCircle,
          { transform: [{ scale: circleScale }] },
        ]}
      />

      {/* ── Top Badge ── */}
      <Animated.View
        style={[
          styles.topBadge,
          { opacity: badgeOpacity, transform: [{ translateY: badgeY }] },
        ]}
      >
        <View style={styles.badgeAccentBar} />
        <View style={styles.badgeContent}>
          <Text style={styles.badgeIndia}>India's</Text>
          <Text style={styles.badgeNo1}>No.1</Text>
          <Text style={styles.badgePlatform}>Meeting Venues{'\n'}Booking Platform</Text>
        </View>
        {/* Diagonal orange slice at bottom */}
        <View style={styles.badgeSlice} />
      </Animated.View>

      {/* ── Center Content ── */}
      <View style={styles.center}>
        {/* Ripple rings behind logo */}
        <View style={styles.rippleContainer}>
          <RippleRing delay={0}    color={ORANGE} />
          <RippleRing delay={700}  color={ORANGE} />
          <RippleRing delay={1400} color="#FFD580" />
        </View>

        {/* Logo Icon */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: floatAnim },
              ],
            },
          ]}
        >
          {/* Glow disc */}
          <View style={styles.logoGlow} />
          {/*
            Replace with: source={require('./assets/images/logo_icon.png')}
          */}
          <Image
            source={require('../assets/logo1.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Animated divider line */}
        <Animated.View style={[styles.divider, { width: dividerWidth }]} />

        {/* Brand Name — split halves slide together */}
        <Animated.View style={[styles.brandRow, { opacity: nameOpacity }]}>
          <Animated.View style={{ transform: [{ translateX: leftSlide }] }}>
            {/*
              Replace with: source={require('./assets/images/logo_name.png')}
              Or use two separate text/image halves
            */}
            <Text style={styles.brandRental}>Rental</Text>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateX: rightSlide }] }}>
            <Text style={styles.brandMeet}>Meet</Text>
          </Animated.View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: tagOpacity,
            transform: [{ translateY: tagSlide }],
            marginTop: 8,
          }}
        >
          <Text style={styles.tagline}>Book Your Premium Meeting Venues..!</Text>
        </Animated.View>
      </View>

      {/* ── Bottom Orange Footer ── */}
      <Animated.View
        style={[
          styles.footer,
          { opacity: footerOpacity, transform: [{ translateY: footerY }] },
        ]}
      >
        {/* Curved top edge */}
        <View style={styles.footerCurve} />
        <View style={styles.footerInner}>
          <Text style={styles.footerPowered}>
            Powered by :{' '}
            <Text style={styles.footerBrand}>Yuwaka EduTech Pvt. Ltd.</Text>
          </Text>
          <Text style={styles.footerCin}>CIN No. : U56201MP2023PTC069015</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Constants & Styles ───────────────────────────────────────────────────────
const ORANGE    = '#F5A31A';
const WHITE     = '#FFFFFF';
const OFF_WHITE = '#FAF9F7';
const DARK      = '#1C1C1C';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OFF_WHITE,
    alignItems: 'center',
    overflow: 'hidden',
  },

  // Full orange base (shows before circle wipe)
  orangeBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ORANGE,
  },

  // White circle expands from center to reveal content
  revealCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: OFF_WHITE,
    top: height / 2 - CIRCLE_SIZE / 2,
    left: width / 2 - CIRCLE_SIZE / 2,
  },

  // ── Top Badge ──
  topBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: ORANGE,
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 28,
    zIndex: 10,
    overflow: 'hidden',
  },
  badgeAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  badgeContent: {
    alignItems: 'flex-start',
  },
  badgeIndia: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  badgeNo1: {
    color: WHITE,
    fontSize: 68,
    fontWeight: '900',
    lineHeight: 72,
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  badgePlatform: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: 0.3,
    opacity: 0.92,
  },
  // Diagonal orange slice decorative bottom
  badgeSlice: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 120,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    transform: [{ rotate: '-15deg' }],
  },

  // ── Center ──
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60, // offset for badge height
    zIndex: 5,
  },

  // Ripple container
  rippleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  rippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: ORANGE,
    opacity: 0.12,
  },
  logoIcon: {
    width: 120,
    height: 120,
  },

  // Divider
  divider: {
    height: 3,
    backgroundColor: ORANGE,
    borderRadius: 2,
    marginTop: 20,
    marginBottom: 14,
  },

  // Brand name split reveal
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandRental: {
    fontSize: 44,
    fontWeight: '900',
    color: ORANGE,
    letterSpacing: -1,
  },
  brandMeet: {
    fontSize: 44,
    fontWeight: '900',
    color: DARK,
    letterSpacing: -1,
  },

  // Tagline
  tagline: {
    color: '#888',
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 1.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // ── Footer ──
  footer: {
    width: '100%',
    backgroundColor: ORANGE,
    paddingBottom: 28,
    zIndex: 10,
    position: 'relative',
  },
  footerCurve: {
    height: 36,
    backgroundColor: OFF_WHITE,
    borderBottomLeftRadius: width * 0.5,
    borderBottomRightRadius: width * 0.5,
    marginBottom: 14,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  footerInner: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerPowered: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  footerBrand: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 13,
  },
  footerCin: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.3,
  },
});

export default SplashScreen;