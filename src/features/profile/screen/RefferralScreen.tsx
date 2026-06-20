import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Share,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { useGetMyProfile } from '../hooks/useGetMyProfile';
import { useAlert } from '@/context/AlertContext';
import { RootStackParamList } from '@/types/RootStackParamList';

type ReferralScreenProps = NativeStackScreenProps<RootStackParamList, 'referral'>;

const REFERRAL_APP_LINK = 'https://rentalmeet.com/app'; // ← replace with your real deep link / store link

const STEPS = [
    {
        id: 1,
        title: 'Share Your Code',
        desc: 'Share your unique referral code with friends and family',
    },
    {
        id: 2,
        title: 'They Sign Up',
        desc: 'When they register using your code, they become your referral',
    },
    {
        id: 3,
        title: 'Earn Rewards',
        desc: 'Get exclusive benefits and rewards for each successful referral',
    },
];

export default function ReferralScreen({ navigation }: ReferralScreenProps) {
    const { data: userData, isLoading, refetch } = useGetMyProfile();
    const user = userData?.user ?? {};
    const alert = useAlert();

    const [copied, setCopied] = useState(false);
    const headerFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, []);

    const referralCode = user.referralCode ?? '—';
    const referralCount = user.referralCount ?? user.referrals?.length ?? 0;

    const handleCopy = () => {
        if (!user.referralCode) return;
        Clipboard.setString(user.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const handleShare = async () => {
        if (!user.referralCode) return;
        try {
            await Share.share({
                message: `Join RentalMeet using my referral code ${user.referralCode} and get exclusive rewards! ${REFERRAL_APP_LINK}`,
            });
        } catch {
            alert.error?.('Share failed', 'Could not open the share sheet. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={22} color={Colors.charcoal} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerEyebrow}>REWARDS</Text>
                        <Text style={styles.headerTitle}>Refer & Earn</Text>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
            >
                {/* Referral code card */}
                <View style={styles.codeCard}>
                    <View style={styles.codeCardTopRow}>
                        <View style={styles.giftIconWrap}>
                            <Ionicons name="gift" size={18} color={Colors.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.codeCardTitle}>Your Referral Code</Text>
                            <Text style={styles.codeCardSubtitle}>
                                Share with friends and earn rewards!
                            </Text>
                        </View>
                    </View>

                    <View style={styles.codeBox}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.codeLabel}>YOUR CODE</Text>
                            <Text style={styles.codeValue}>{referralCode}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.copyBtn, copied && styles.copyBtnCopied]}
                            onPress={handleCopy}
                            disabled={!user.referralCode}
                            activeOpacity={0.85}
                        >
                            <Ionicons
                                name={copied ? 'checkmark' : 'copy-outline'}
                                size={14}
                                color={Colors.white}
                            />
                            <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={handleShare}
                        disabled={!user.referralCode}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="share-social-outline" size={16} color={Colors.white} />
                        <Text style={styles.shareBtnText}>Share Code</Text>
                    </TouchableOpacity>
                </View>

                {/* Total referrals */}
                <View style={styles.statCard}>
                    <View style={styles.statIconWrap}>
                        <Ionicons name="people" size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>Total Referrals</Text>
                        <Text style={styles.statValue}>{referralCount}</Text>
                        <Text style={styles.statHint}>People who joined using your code</Text>
                    </View>
                </View>

                {/* How it works */}
                <View style={styles.howCard}>
                    <Text style={styles.howTitle}>How Referral Works</Text>
                    {STEPS.map((step, i) => (
                        <View
                            key={step.id}
                            style={[styles.stepRow, i < STEPS.length - 1 && styles.stepRowSpacing]}
                        >
                            <View style={styles.stepNumberWrap}>
                                <Text style={styles.stepNumberText}>{step.id}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDesc}>{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Referral list, if any */}
                {!!user.referrals?.length && (
                    <View style={styles.howCard}>
                        <Text style={styles.howTitle}>Your Referrals</Text>
                        {user.referrals.map((r:any, i:any) => (
                            <View
                                key={`${r.user}-${i}`}
                                style={[
                                    styles.referralRow,
                                    i < user.referrals!.length - 1 && styles.referralRowDivider,
                                ]}
                            >
                                <View style={styles.referralAvatarWrap}>
                                    <Ionicons name="person" size={14} color={Colors.primary} />
                                </View>
                                <Text style={styles.referralJoinedText}>
                                    Joined{' '}
                                    {r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : '—'}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.xl,
        ...Shadows.header,
        zIndex: 10,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wider,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.6,
    },
    content: { flex: 1 },
    contentPadding: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 60 },

    codeCard: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    codeCardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: Spacing.lg,
    },
    giftIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    codeCardTitle: { fontSize: 15, fontWeight: Typography.bold, color: Colors.charcoal },
    codeCardSubtitle: {
        fontSize: 12,
        color: Colors.charcoalLight,
        marginTop: 2,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        marginBottom: Spacing.md,
        ...Shadows.card,
    },
    codeLabel: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 1,
        marginBottom: 2,
    },
    codeValue: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
        letterSpacing: 1.5,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: Radii.md,
    },
    copyBtnCopied: { backgroundColor: Colors.success },
    copyBtnText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.white },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        paddingVertical: 12,
    },
    shareBtnText: { fontSize: 14, fontWeight: Typography.bold, color: Colors.white },

    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    statIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.semiBold },
    statValue: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginTop: 2,
    },
    statHint: { fontSize: 11, color: Colors.charcoalLight, marginTop: 2 },

    howCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    howTitle: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
    },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    stepRowSpacing: { marginBottom: Spacing.md },
    stepNumberWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: { fontSize: 12, fontWeight: Typography.extraBold, color: Colors.white },
    stepTitle: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoal },
    stepDesc: { fontSize: 12, color: Colors.charcoalLight, marginTop: 2, lineHeight: 17 },

    referralRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
    },
    referralRowDivider: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.background,
    },
    referralAvatarWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    referralJoinedText: {
        fontSize: 13,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
    },
});
