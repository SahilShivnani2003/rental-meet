import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
    ScrollView,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';

const { width: W, height: H } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'onBoarding'>;

// ─── Slide data — single brand palette across all 3 slides ───────────────────
const SLIDES = [
    {
        id: 1,
        step: '01',
        eyebrow: 'DISCOVER',
        title: 'Find the Perfect\nVenue',
        subtitle:
            'Browse hundreds of premium meeting halls, banquet spaces and conference rooms — all in one place.',
        features: [
            { icon: 'location-outline', label: 'Search by city or area' },
            { icon: 'options-outline', label: 'Filter by capacity & budget' },
            { icon: 'star-outline', label: 'Verified & rated venues' },
        ],
        illustration: 'buildings',
    },
    {
        id: 2,
        step: '02',
        eyebrow: 'BOOK INSTANTLY',
        title: 'Reserve in\nSeconds',
        subtitle:
            'Check real-time availability, choose your duration and confirm your booking — no phone calls needed.',
        features: [
            { icon: 'time-outline', label: 'Real-time availability' },
            { icon: 'card-outline', label: 'Secure online payments' },
            { icon: 'notifications-outline', label: 'Instant booking confirmation' },
        ],
        illustration: 'calendar',
    },
    {
        id: 3,
        step: '03',
        eyebrow: 'LIST & EARN',
        title: 'Own a Space?\nStart Earning',
        subtitle:
            'List your venue in minutes, set your own pricing and start receiving bookings from thousands of clients.',
        features: [
            { icon: 'add-circle-outline', label: 'Easy venue listing' },
            { icon: 'cash-outline', label: 'Transparent earnings' },
            { icon: 'shield-checkmark-outline', label: 'Verified owner badge' },
        ],
        illustration: 'owner',
    },
] as const;

// ─── Illustrations ─────────────────────────────────────────────────────────────
function SlideIllustration({ type }: { type: string }) {
    // ── Slide 1: Buildings ──
    if (type === 'buildings') {
        return (
            <View style={il.wrap}>
                <View
                    style={[
                        il.ring,
                        {
                            width: 280,
                            height: 280,
                            borderRadius: 140,
                            borderColor: Colors.primaryBorder + '50',
                        },
                    ]}
                />
                <View
                    style={[
                        il.ring,
                        {
                            width: 200,
                            height: 200,
                            borderRadius: 100,
                            borderColor: Colors.primaryBorder + '80',
                        },
                    ]}
                />
                <View
                    style={[
                        il.ring,
                        {
                            width: 130,
                            height: 130,
                            borderRadius: 65,
                            borderColor: Colors.primaryBorder + 'AA',
                        },
                    ]}
                />
                <View style={[il.glow, { backgroundColor: Colors.primaryLight }]} />

                <View style={il.cityRow}>
                    {/* Left building */}
                    <View
                        style={[
                            il.bld,
                            {
                                height: 78,
                                width: 38,
                                backgroundColor: Colors.background,
                                borderColor: Colors.border,
                                marginRight: 4,
                            },
                        ]}
                    >
                        <View style={[il.bldCap, { backgroundColor: Colors.border }]} />
                        {[0, 1, 2, 3].map(r => (
                            <View key={r} style={il.winRow}>
                                {[0, 1].map(c => (
                                    <View
                                        key={c}
                                        style={[
                                            il.win,
                                            {
                                                backgroundColor:
                                                    r === 0 ? Colors.primaryDim : Colors.border,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* Centre hero building — charcoal */}
                    <View
                        style={[
                            il.bld,
                            {
                                height: 138,
                                width: 60,
                                backgroundColor: Colors.charcoal,
                                borderColor: Colors.charcoal,
                                marginRight: 4,
                                zIndex: 3,
                            },
                        ]}
                    >
                        <View
                            style={[
                                il.bldCap,
                                { backgroundColor: Colors.charcoalMid, alignItems: 'center' },
                            ]}
                        >
                            <View
                                style={{
                                    width: 2,
                                    height: 14,
                                    backgroundColor: Colors.primary,
                                    borderRadius: 1,
                                    marginTop: -10,
                                }}
                            />
                        </View>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map(r => (
                            <View key={r} style={il.winRow}>
                                {[0, 1, 2].map(c => (
                                    <View
                                        key={c}
                                        style={[
                                            il.win,
                                            {
                                                backgroundColor:
                                                    (r + c) % 3 === 0
                                                        ? Colors.primary + 'DD'
                                                        : r % 2 === 0
                                                        ? Colors.charcoalMid
                                                        : Colors.charcoalLight + '44',
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* Right building */}
                    <View
                        style={[
                            il.bld,
                            {
                                height: 94,
                                width: 42,
                                backgroundColor: Colors.divider,
                                borderColor: Colors.border,
                            },
                        ]}
                    >
                        <View style={[il.bldCap, { backgroundColor: Colors.border }]} />
                        {[0, 1, 2, 3, 4].map(r => (
                            <View key={r} style={il.winRow}>
                                {[0, 1].map(c => (
                                    <View
                                        key={c}
                                        style={[
                                            il.win,
                                            {
                                                backgroundColor:
                                                    r < 2 ? Colors.primaryDim : Colors.background,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Pin */}
                <View style={[il.pin, { backgroundColor: Colors.primary, ...Shadows.primary }]}>
                    <Ionicons name="location" size={13} color={Colors.white} />
                </View>

                {/* Float card */}
                <View style={[il.floatCard, { backgroundColor: Colors.surface, ...Shadows.card }]}>
                    <View style={[il.floatDot, { backgroundColor: Colors.primary }]} />
                    <Text style={il.floatText}>32 venues nearby</Text>
                </View>

                {/* Ground line */}
                <View
                    style={[il.ground, { backgroundColor: Colors.primaryBorder, opacity: 0.35 }]}
                />
            </View>
        );
    }

    // ── Slide 2: Calendar ──
    if (type === 'calendar') {
        return (
            <View style={il.wrap}>
                <View
                    style={[
                        il.ring,
                        {
                            width: 280,
                            height: 280,
                            borderRadius: 140,
                            borderColor: Colors.primaryBorder + '50',
                        },
                    ]}
                />
                <View
                    style={[
                        il.ring,
                        {
                            width: 200,
                            height: 200,
                            borderRadius: 100,
                            borderColor: Colors.primaryBorder + '80',
                        },
                    ]}
                />
                <View
                    style={[
                        il.ring,
                        {
                            width: 130,
                            height: 130,
                            borderRadius: 65,
                            borderColor: Colors.primaryBorder + 'AA',
                        },
                    ]}
                />
                <View style={[il.glow, { backgroundColor: Colors.primaryLight }]} />

                <View style={[il.calCard, { backgroundColor: Colors.surface, ...Shadows.card }]}>
                    {/* Amber header */}
                    <View style={[il.calHead, { backgroundColor: Colors.primary }]}>
                        <View>
                            <Text style={il.calMonth}>MARCH</Text>
                            <Text style={il.calYear}>2026</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <Ionicons name="chevron-back" size={13} color={Colors.white} />
                            <Ionicons name="chevron-forward" size={13} color={Colors.white} />
                        </View>
                    </View>

                    {/* Weekday row */}
                    <View style={il.calDaysRow}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                            <Text
                                key={i}
                                style={[il.calDay, i >= 5 && { color: Colors.primaryDark }]}
                            >
                                {d}
                            </Text>
                        ))}
                    </View>
                    <View style={[il.calSep, { backgroundColor: Colors.divider }]} />

                    {/* Date grid */}
                    {[
                        [1, 2, 3, 4, 5, 6, 7],
                        [8, 9, 10, 11, 12, 13, 14],
                        [15, 16, 17, 18, 19, 20, 21],
                    ].map((row, ri) => (
                        <View key={ri} style={il.calRow}>
                            {row.map((d, di) => (
                                <View
                                    key={di}
                                    style={[
                                        il.calCell,
                                        d === 17 && {
                                            backgroundColor: Colors.primary,
                                            borderRadius: 9,
                                        },
                                        (d === 12 || d === 13) && {
                                            backgroundColor: Colors.primaryLight,
                                            borderRadius: 7,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            il.calNum,
                                            d === 17 && {
                                                color: Colors.white,
                                                fontWeight: Typography.extraBold,
                                            },
                                            (d === 12 || d === 13) && { color: Colors.primaryDark },
                                        ]}
                                    >
                                        {d}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Confirmed badge */}
                <View
                    style={[
                        il.floatingBadge,
                        {
                            backgroundColor: Colors.successLight,
                            borderColor: Colors.success + '44',
                            bottom: '16%' as any,
                            right: '4%' as any,
                        },
                    ]}
                >
                    <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                    <Text style={[il.floatingBadgeText, { color: Colors.success }]}>
                        Booking Confirmed!
                    </Text>
                </View>

                {/* Time chip */}
                <View
                    style={[
                        il.floatingChip,
                        {
                            backgroundColor: Colors.primaryLight,
                            borderColor: Colors.primaryBorder,
                            top: '16%' as any,
                            left: '3%' as any,
                        },
                    ]}
                >
                    <Ionicons name="time-outline" size={11} color={Colors.primaryDark} />
                    <Text style={[il.floatingChipText, { color: Colors.primaryDark }]}>
                        10:00 AM – 2:00 PM
                    </Text>
                </View>
            </View>
        );
    }

    // ── Slide 3: Owner ──
    return (
        <View style={il.wrap}>
            <View
                style={[
                    il.ring,
                    {
                        width: 280,
                        height: 280,
                        borderRadius: 140,
                        borderColor: Colors.primaryBorder + '50',
                    },
                ]}
            />
            <View
                style={[
                    il.ring,
                    {
                        width: 200,
                        height: 200,
                        borderRadius: 100,
                        borderColor: Colors.primaryBorder + '80',
                    },
                ]}
            />
            <View
                style={[
                    il.ring,
                    {
                        width: 130,
                        height: 130,
                        borderRadius: 65,
                        borderColor: Colors.primaryBorder + 'AA',
                    },
                ]}
            />
            <View style={[il.glow, { backgroundColor: Colors.primaryLight }]} />

            <View style={[il.venueCard, { backgroundColor: Colors.surface, ...Shadows.card }]}>
                {/* Hero */}
                <View style={[il.venueHero, { backgroundColor: Colors.primaryLight }]}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <View
                            key={i}
                            style={[
                                il.heroStripe,
                                { left: i * 38, backgroundColor: Colors.primary + '12' },
                            ]}
                        />
                    ))}
                    <View style={[il.venueIconCircle, { backgroundColor: Colors.primary + '22' }]}>
                        <Ionicons name="business" size={32} color={Colors.primary} />
                    </View>
                    <View style={[il.verTag, { backgroundColor: Colors.charcoal }]}>
                        <Ionicons name="shield-checkmark" size={9} color={Colors.primary} />
                        <Text style={il.verText}>VERIFIED</Text>
                    </View>
                </View>

                {/* Body */}
                <View style={il.venueBody}>
                    <Text style={[il.venueName, { color: Colors.charcoal }]}>
                        Grand Conference Hall
                    </Text>
                    <View style={il.venueMeta}>
                        <Ionicons name="location-outline" size={10} color={Colors.charcoalLight} />
                        <Text style={[il.venueMetaTxt, { color: Colors.charcoalLight }]}>
                            Bhopal, MP
                        </Text>
                        <View style={[il.metaDot, { backgroundColor: Colors.border }]} />
                        <Text style={[il.venueMetaTxt, { color: Colors.charcoalLight }]}>
                            200 guests
                        </Text>
                    </View>
                    <View style={[il.venueDivider, { backgroundColor: Colors.divider }]} />
                    <View style={il.venueFooter}>
                        <Text style={[il.venuePrice, { color: Colors.primary }]}>
                            ₹1,200
                            <Text style={[il.venuePer, { color: Colors.charcoalLight }]}>/hr</Text>
                        </Text>
                        <View style={[il.livePill, { backgroundColor: Colors.primaryLight }]}>
                            <View style={[il.liveDot, { backgroundColor: Colors.primaryDark }]} />
                            <Text style={[il.liveText, { color: Colors.primaryDark }]}>Live</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Earnings badge */}
            <View
                style={[
                    il.floatingBadge,
                    {
                        backgroundColor: Colors.primaryLight,
                        borderColor: Colors.primaryBorder,
                        bottom: '15%' as any,
                        right: '4%' as any,
                    },
                ]}
            >
                <Ionicons name="trending-up" size={13} color={Colors.primaryDark} />
                <Text style={[il.floatingBadgeText, { color: Colors.primaryDark }]}>
                    ₹24,600 this month
                </Text>
            </View>

            {/* Bookings chip */}
            <View
                style={[
                    il.floatingChip,
                    {
                        backgroundColor: Colors.surface,
                        borderColor: Colors.border,
                        top: '16%' as any,
                        left: '3%' as any,
                        ...Shadows.card,
                    },
                ]}
            >
                <Ionicons name="calendar-outline" size={11} color={Colors.charcoalMid} />
                <Text style={[il.floatingChipText, { color: Colors.charcoalMid }]}>
                    18 new bookings
                </Text>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }: Props) {
    const [current, setCurrent] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const goTo = (idx: number) => {
        scrollRef.current?.scrollTo({ x: W * idx, animated: true });
        setCurrent(idx);
    };

    const handleNext = () => {
        if (current < SLIDES.length - 1) goTo(current + 1);
        else navigation.replace('login');
    };

    const slide = SLIDES[current];

    return (
        <View style={s.root}>
            <StatusBar backgroundColor={Colors.surface} barStyle="dark-content" />

            {/* ── Top bar ── */}
            <View style={s.topBar}>
                <View style={s.topAmberLine} />
                <View style={s.topContent}>
                    <Image
                        source={require('../assets/NameLogo.png')}
                        style={s.logo}
                        resizeMode="contain"
                    />
                    <View style={s.topRight}>
                        {/* Step indicator pill */}
                        <View style={s.stepPill}>
                            <Text style={s.stepNum}>{slide.step}</Text>
                            <Text style={s.stepOf}> / 03</Text>
                        </View>
                        {current < SLIDES.length - 1 && (
                            <TouchableOpacity
                                style={s.skipBtn}
                                onPress={() => navigation.replace('login')}
                                activeOpacity={0.7}
                            >
                                <Text style={s.skipTxt}>Skip</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* ── Slides ── */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
            >
                {SLIDES.map(sl => (
                    <View key={sl.id} style={s.slide}>
                        {/* ── Vertical scroll — lets content breathe on short screens ── */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            bounces={true}
                            contentContainerStyle={s.slideScroll}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Illustration zone */}
                            <View style={s.ilZone}>
                                <View style={s.ilBg} />
                                <View style={s.diagStrip} />
                                <SlideIllustration type={sl.illustration} />
                            </View>

                            {/* Content card */}
                            <View style={s.card}>
                                {/* Amber top accent bar */}
                                <View style={s.cardBar} />

                                {/* Eyebrow */}
                                <View style={s.eyebrowRow}>
                                    <View style={s.eyebrowDot} />
                                    <Text style={s.eyebrow}>{sl.eyebrow}</Text>
                                </View>

                                {/* Title */}
                                <Text style={s.title}>{sl.title}</Text>

                                {/* Subtitle */}
                                <Text style={s.subtitle}>{sl.subtitle}</Text>

                                {/* Divider */}
                                <View style={s.cardDivider} />

                                {/* Feature rows */}
                                <View style={s.featureList}>
                                    {sl.features.map((f, fi) => (
                                        <View
                                            key={fi}
                                            style={[
                                                s.featureRow,
                                                fi < sl.features.length - 1 && s.featureRowBorder,
                                            ]}
                                        >
                                            <View style={s.featureIconBox}>
                                                <Ionicons
                                                    name={f.icon as any}
                                                    size={15}
                                                    color={Colors.primary}
                                                />
                                            </View>
                                            <Text style={s.featureLabel}>{f.label}</Text>
                                            <Ionicons
                                                name="chevron-forward"
                                                size={11}
                                                color={Colors.border}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Bottom spacing so card clears the fixed bottom bar */}
                            <View style={s.scrollBottomSpacer} />
                        </ScrollView>
                    </View>
                ))}
            </ScrollView>

            {/* ── Bottom bar ── */}
            <View style={s.bottomBar}>
                {/* Dot indicators */}
                <View style={s.dotsRow}>
                    {SLIDES.map((_, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => goTo(i)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <View
                                style={[
                                    s.dot,
                                    i === current
                                        ? [s.dotActive, { backgroundColor: Colors.primary }]
                                        : { backgroundColor: Colors.border, width: 7 },
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* CTA — charcoal button with amber icon bubble */}
                <TouchableOpacity style={s.cta} onPress={handleNext} activeOpacity={0.85}>
                    <Text style={s.ctaText}>
                        {current === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
                    </Text>
                    <View style={s.ctaIconBubble}>
                        <Ionicons
                            name={
                                current === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'
                            }
                            size={16}
                            color={Colors.primary}
                        />
                    </View>
                </TouchableOpacity>

                {/* Login link */}
                <TouchableOpacity
                    style={s.loginRow}
                    onPress={() => navigation.replace('login')}
                    activeOpacity={0.7}
                >
                    <Text style={s.loginText}>Already have an account? </Text>
                    <Text style={s.loginLink}>Log In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Illustration styles ───────────────────────────────────────────────────────
const il = StyleSheet.create({
    wrap: {
        width: W,
        height: H * 0.43,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ring: {
        position: 'absolute',
        borderWidth: 1,
    },
    glow: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        opacity: 0.65,
    },

    // Buildings
    cityRow: { flexDirection: 'row', alignItems: 'flex-end' },
    bld: {
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        paddingHorizontal: 4,
        paddingBottom: 4,
        borderWidth: 1,
    },
    bldCap: {
        height: 10,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    winRow: { flexDirection: 'row', gap: 4, marginBottom: 4, justifyContent: 'center' },
    win: { width: 9, height: 8, borderRadius: 2 },
    pin: {
        position: 'absolute',
        top: '13%' as any,
        right: '26%' as any,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatCard: {
        position: 'absolute',
        bottom: '15%' as any,
        right: '7%' as any,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: Radii.full,
    },
    floatDot: { width: 8, height: 8, borderRadius: 4 },
    floatText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.charcoal },
    ground: {
        position: 'absolute',
        bottom: '8%' as any,
        left: '7%' as any,
        right: '7%' as any,
        height: 2,
        borderRadius: 2,
    },

    // Calendar
    calCard: { width: 228, borderRadius: Radii.xl, overflow: 'hidden' },
    calHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    calMonth: {
        fontSize: 12,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 1.4,
    },
    calYear: { fontSize: 9, fontWeight: Typography.medium, color: Colors.white + 'BB' },
    calDaysRow: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 5 },
    calDay: {
        flex: 1,
        textAlign: 'center',
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
    },
    calSep: { height: 1, marginHorizontal: 10, marginBottom: 3 },
    calRow: { flexDirection: 'row', paddingHorizontal: 10, marginBottom: 4 },
    calCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
    calNum: { fontSize: 11, fontWeight: Typography.medium, color: Colors.charcoal },

    // Reusable floating badge & chip
    floatingBadge: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: Radii.full,
        borderWidth: 1,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    floatingBadgeText: { fontSize: 10, fontWeight: Typography.bold },
    floatingChip: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: Radii.full,
        borderWidth: 1,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 3,
    },
    floatingChipText: { fontSize: 10, fontWeight: Typography.bold },

    // Venue card
    venueCard: { width: 234, borderRadius: Radii.xl, overflow: 'hidden' },
    venueHero: {
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    heroStripe: {
        position: 'absolute',
        top: -20,
        width: 24,
        height: 160,
        transform: [{ rotate: '15deg' }],
    },
    venueIconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verTag: {
        position: 'absolute',
        top: 9,
        right: 9,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    verText: {
        fontSize: 8,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: 0.8,
    },
    venueBody: { padding: 13 },
    venueName: { fontSize: 13, fontWeight: Typography.extraBold, marginBottom: 4 },
    venueMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 9 },
    venueMetaTxt: { fontSize: 10, fontWeight: Typography.medium },
    metaDot: { width: 3, height: 3, borderRadius: 1.5 },
    venueDivider: { height: 1, marginBottom: 9 },
    venueFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    venuePrice: { fontSize: 16, fontWeight: Typography.extraBold },
    venuePer: { fontSize: 11, fontWeight: Typography.medium },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveText: { fontSize: 10, fontWeight: Typography.bold },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Top bar
    topBar: {
        backgroundColor: Colors.surface,
        ...Shadows.header,
    },
    topAmberLine: {
        height: 3,
        backgroundColor: Colors.primary,
    },
    topContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
        paddingBottom: Spacing.md,
    },
    logo: { height: 26, width: 110 },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    stepPill: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    stepNum: {
        fontSize: Typography.sm,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
    stepOf: { fontSize: Typography.xs, fontWeight: Typography.regular, color: Colors.charcoalWarm },
    skipBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    skipTxt: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },

    // Slide
    slide: { width: W, flex: 1 },

    // Vertical scroll content container
    slideScroll: {
        flexGrow: 1,
    },

    // Pushes card bottom clear of the fixed bottom bar
    scrollBottomSpacer: {
        height: Spacing.xl,
    },

    // Illustration zone
    ilZone: {
        height: H * 0.43,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: Colors.background,
    },
    ilBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.primaryLight,
        opacity: 0.3,
    },
    diagStrip: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        right: -60,
        height: H * 0.28,
        backgroundColor: Colors.primaryLight,
        transform: [{ rotate: '-7deg' }],
        opacity: 0.65,
    },

    // Content card
    card: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: -(Spacing.xl + 6),
        borderRadius: Radii.xxl,
        overflow: 'hidden',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.lg,
        ...Shadows.card,
    },
    cardBar: {
        position: 'absolute',
        top: 0,
        left: Spacing.xxl,
        right: Spacing.xxl,
        height: 3,
        backgroundColor: Colors.primary,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    },

    // Eyebrow
    eyebrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.xs,
        marginTop: Spacing.xs,
    },
    eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
    eyebrow: {
        fontSize: Typography.xs,
        fontWeight: Typography.extraBold,
        letterSpacing: Typography.wider,
        color: Colors.primary,
    },

    title: {
        fontSize: 26,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        lineHeight: 32,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        lineHeight: 20,
        fontWeight: Typography.regular,
    },

    cardDivider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.md,
    },

    // Features
    featureList: { gap: 0 },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: 10,
    },
    featureRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    featureIconBox: {
        width: 34,
        height: 34,
        borderRadius: Radii.sm,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    featureLabel: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.charcoalMid,
    },

    // Bottom bar
    bottomBar: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 38 : Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        alignItems: 'center',
        gap: Spacing.md,
        ...Shadows.floating,
    },

    dotsRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
    dot: { height: 7, borderRadius: 3.5 },
    dotActive: { width: 26 },

    // CTA — charcoal body, amber icon bubble
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 16,
        borderRadius: Radii.full,
        backgroundColor: Colors.charcoal,
        gap: Spacing.sm,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 6,
    },
    ctaText: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: Typography.normal,
    },
    ctaIconBubble: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Login link
    loginRow: { flexDirection: 'row', alignItems: 'center' },
    loginText: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    loginLink: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
});
