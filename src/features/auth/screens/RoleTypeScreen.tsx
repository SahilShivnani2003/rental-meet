import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { RoleCard } from '../components/RoleCard';
import { ROLES } from '../types/Role';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type registerTypeParams = NativeStackScreenProps<RootStackParamList, 'registerType'>;

export default function RegisterTypeScreen({ navigation }: registerTypeParams) {
    const headerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        StatusBar.setBarStyle('dark-content');
        Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const handleSelect = (roleId: string) => {
        navigation.navigate('register',{
            role:roleId
        });
    };

    return (
        <View style={styles.container}>
            {/* Decorative amber arc */}
            <View style={styles.arcTop} />

            {/* ── Header ── */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: headerAnim,
                        transform: [
                            {
                                translateY: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-12, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                {/* Back button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                </TouchableOpacity>

                <Text style={styles.headerEyebrow}>GET STARTED</Text>
                <Text style={styles.headerTitle}>I am a…</Text>
                <Text style={styles.headerSubtitle}>
                    Choose your role to create the right account for you.
                </Text>
            </Animated.View>

            {/* ── Role cards ── */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
            >
                {ROLES.map((role, index) => (
                    <RoleCard key={role.id} role={role} index={index} onSelect={handleSelect} />
                ))}

                {/* Already have an account */}
                <Animated.View style={[styles.loginRow, { opacity: headerAnim }]}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('login')}>
                        <Text style={styles.loginLink}>Sign in</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },

    arcTop: {
        position: 'absolute',
        top: -SCREEN_WIDTH * 0.55,
        left: -SCREEN_WIDTH * 0.3,
        width: SCREEN_WIDTH * 1.1,
        height: SCREEN_WIDTH * 1.1,
        borderRadius: SCREEN_WIDTH * 0.55,
        backgroundColor: Colors.primaryLight,
        opacity: 0.55,
    },

    // Header
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: SCREEN_HEIGHT * 0.03,
        paddingBottom: Spacing.lg
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg, ...Shadows.card
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal, letterSpacing: -0.8,
        lineHeight: 40
    },
    headerSubtitle: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        lineHeight: 22, marginTop: Spacing.xs
    },
    content: {
        flex: 1
    },
    contentPadding: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: 48
    },
    // Already have account
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.lg
    },
    loginText: {
        fontSize: 14,
        color: Colors.charcoalLight
    },
    loginLink: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.primary
    },
});