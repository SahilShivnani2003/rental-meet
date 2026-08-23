import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FLAG_SIZE = 130;

type SplashScreenProps = NativeStackScreenProps<RootStackParamList, 'splash'>;
export default function SplashScreen2({ navigation }: SplashScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(16)).current;
    const cardScale = useRef(new Animated.Value(0.9)).current;
    const { loadUser } = useAuthStore();

    const handleNavigation = async () => {
        await loadUser();
        const { user, isAuthenticated } = useAuthStore.getState();
        setTimeout(() => {
            if (isAuthenticated) {
                if (user?.role === 'owner') navigation.replace('owner');
                else if (user?.role === 'vendor') navigation.replace('vendor');
                else if (user?.role === 'customer') navigation.replace('client');
                else if (user?.role === 'ambassador') navigation.replace('ambassador');
                else navigation.replace('onBoarding');
            } else {
                navigation.replace('onBoarding');
            }
        }, 5000);
    };

    useEffect(() => {
        handleNavigation();
    },[]);
    
    useEffect(() => {
        StatusBar.setBarStyle('light-content');
        if (Platform.OS === 'android') {
            StatusBar.setBackgroundColor(Colors.primary);
        }

        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 12,
                    bounciness: 6,
                }),
            ]),
            Animated.spring(cardScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 14,
                bounciness: 8,
            }),
        ]).start();
    }, []);

    return (
        <View style={s.container}>
            {/* Flag badge */}
            <Animated.View
                style={[s.flagWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
                <Image
                    source={require('@assets/flag.jpg')}
                    style={s.flagCircle}
                    resizeMode="cover"
                />
            </Animated.View>

            {/* Heading */}
            <Animated.View
                style={[
                    s.headingWrap,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <View style={s.headingRow}>
                    <Text style={s.headingTitle}>India's 1</Text>
                    <Text style={s.headingSup}>st</Text>
                </View>
                <Text style={s.headingSubtitle}>Venue Booking Platform</Text>
            </Animated.View>

            {/* Logo card */}
            <Animated.View
                style={[s.logoCard, { opacity: fadeAnim, transform: [{ scale: cardScale }] }]}
            >
                <Image
                    source={require('@assets/NameLogo.png')}
                    style={s.logoImage}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Spacer pushes the footer to the bottom */}
            <View style={{ flex: 1 }} />

            {/* Footer pill */}
            <Animated.View style={[s.footerPill, { opacity: fadeAnim }]}>
                <Text style={s.footerText}>
                    Powered by : <Text style={s.footerTextBold}>Yuwaka EduTech Pvt. Ltd.</Text>
                </Text>
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 90 : 70,
        paddingBottom: Spacing.xxl,
    },

    // Flag badge
    flagWrap: {
        ...Shadows.card,
        shadowOpacity: 0.18,
        borderRadius: FLAG_SIZE / 2,
    },
    flagCircle: {
        width: FLAG_SIZE,
        height: FLAG_SIZE,
        borderRadius: FLAG_SIZE / 2,
        backgroundColor: Colors.white,
    },

    // Heading
    headingWrap: {
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xxl + Spacing.lg,
    },
    headingTitle: {
        fontSize: Typography.xxxl,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: Typography.tight,
    },
    headingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    headingSup: {
        fontSize: Typography.sm,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        marginLeft: -3,
        marginTop: 4,
    },
    headingSubtitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.white,
        marginTop: Spacing.xs,
    },

    // Logo card
    logoCard: {
        width: SCREEN_WIDTH - 64,
        backgroundColor: Colors.white,
        borderRadius: Radii.xxl,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        marginTop: Spacing.xxl,
        justifyContent: 'center',
        ...Shadows.header,
    },
    logoImage: {
        width: '100%',
        height: 70,
    },

    // Footer
    footerPill: {
        backgroundColor: Colors.white,
        borderRadius: Radii.full,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        width: SCREEN_WIDTH - 64,
        alignItems: 'center',
        ...Shadows.card,
    },
    footerText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.regular,
    },
    footerTextBold: {
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
});
