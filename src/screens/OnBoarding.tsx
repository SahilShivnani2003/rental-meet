import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';

const { width: W } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'onBoarding'>;

// ─── Slide data ───────────────────────────────────────────────────────────────
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

// ─── Illustrations — adapted for amber background ─────────────────────────────
function SlideIllustration({ type, height }: { type: string; height: number }) {
    // ── Slide 1: Buildings ──
    if (type === 'buildings') {
        return (
            <View style={[il.wrap, { height }]}>
                {/* Concentric rings — white on amber */}
                <View
                    style={[
                        il.ring,
                        {
                            width: 280,
                            height: 280,
                            borderRadius: 140,
                            borderColor: 'rgba(255,255,255,0.20)',
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
                            borderColor: 'rgba(255,255,255,0.28)',
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
                            borderColor: 'rgba(255,255,255,0.38)',
                        },
                    ]}
                />

                {/* Warm white glow */}
                <View style={[il.glow, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />

                <View style={il.cityRow}>
                    {/* Left building — white card */}
                    <View
                        style={[
                            il.bld,
                            {
                                height: 78,
                                width: 38,
                                backgroundColor: Colors.surface,
                                borderColor: 'rgba(255,255,255,0.6)',
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
                                                    r === 0 ? Colors.primaryBorder : Colors.border,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* Centre hero building — charcoal (brand) */}
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

                    {/* Right building — light card */}
                    <View
                        style={[
                            il.bld,
                            {
                                height: 94,
                                width: 42,
                                backgroundColor: Colors.background,
                                borderColor: 'rgba(255,255,255,0.5)',
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
                                                    r < 2 ? Colors.primaryBorder : Colors.surface,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Pin — charcoal on amber bg */}
                <View
                    style={[
                        il.pin,
                        {
                            backgroundColor: Colors.charcoal,
                            shadowColor: Colors.charcoal,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 5,
                        },
                    ]}
                >
                    <Ionicons name="location" size={13} color={Colors.primary} />
                </View>

                {/* Float card */}
                <View style={[il.floatCard, { backgroundColor: Colors.surface, ...Shadows.card }]}>
                    <View style={[il.floatDot, { backgroundColor: Colors.primary }]} />
                    <Text style={il.floatText}>32 venues nearby</Text>
                </View>

                {/* Ground line */}
                <View style={[il.ground, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
            </View>
        );
    }

    // ── Slide 2: Calendar ──
    if (type === 'calendar') {
        return (
            <View style={[il.wrap, { height }]}>
                <View
                    style={[
                        il.ring,
                        {
                            width: 280,
                            height: 280,
                            borderRadius: 140,
                            borderColor: 'rgba(255,255,255,0.20)',
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
                            borderColor: 'rgba(255,255,255,0.28)',
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
                            borderColor: 'rgba(255,255,255,0.38)',
                        },
                    ]}
                />
                <View style={[il.glow, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />

                <View style={[il.calCard, { backgroundColor: Colors.surface, ...Shadows.card }]}>
                    {/* Charcoal header — logo matches */}
                    <View style={[il.calHead, { backgroundColor: Colors.charcoal }]}>
                        <View>
                            <Text style={il.calMonth}>MARCH</Text>
                            <Text style={il.calYear}>2026</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <Ionicons name="chevron-back" size={13} color={Colors.primary} />
                            <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
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

                {/* Time chip — white on amber */}
                <View
                    style={[
                        il.floatingChip,
                        {
                            backgroundColor: Colors.surface,
                            borderColor: 'rgba(255,255,255,0.6)',
                            top: '16%' as any,
                            left: '3%' as any,
                            ...Shadows.card,
                        },
                    ]}
                >
                    <Ionicons name="time-outline" size={11} color={Colors.charcoalMid} />
                    <Text style={[il.floatingChipText, { color: Colors.charcoalMid }]}>
                        10:00 AM – 2:00 PM
                    </Text>
                </View>
            </View>
        );
    }

    // ── Slide 3: Owner ──
    return (
        <View style={[il.wrap, { height }]}>
            <View
                style={[
                    il.ring,
                    {
                        width: 280,
                        height: 280,
                        borderRadius: 140,
                        borderColor: 'rgba(255,255,255,0.20)',
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
                        borderColor: 'rgba(255,255,255,0.28)',
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
                        borderColor: 'rgba(255,255,255,0.38)',
                    },
                ]}
            />
            <View style={[il.glow, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />

            <View style={[il.venueCard, { backgroundColor: Colors.surface, ...Shadows.card }]}>
                {/* Hero */}
                <View style={[il.venueHero, { backgroundColor: Colors.charcoal }]}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <View
                            key={i}
                            style={[
                                il.heroStripe,
                                { left: i * 38, backgroundColor: 'rgba(255,255,255,0.05)' },
                            ]}
                        />
                    ))}
                    <View style={[il.venueIconCircle, { backgroundColor: Colors.primary + '22' }]}>
                        <Ionicons name="business" size={32} color={Colors.primary} />
                    </View>
                    <View style={[il.verTag, { backgroundColor: Colors.primary }]}>
                        <Ionicons name="shield-checkmark" size={9} color={Colors.white} />
                        <Text style={[il.verText, { color: Colors.white }]}>VERIFIED</Text>
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
                        backgroundColor: Colors.surface,
                        borderColor: 'rgba(255,255,255,0.5)',
                        bottom: '15%' as any,
                        right: '4%' as any,
                        ...Shadows.card,
                    },
                ]}
            >
                <Ionicons name="trending-up" size={13} color={Colors.primaryDark} />
                <Text style={[il.floatingBadgeText, { color: Colors.charcoal }]}>
                    ₹24,600 this month
                </Text>
            </View>

            {/* Bookings chip */}
            <View
                style={[
                    il.floatingChip,
                    {
                        backgroundColor: Colors.surface,
                        borderColor: 'rgba(255,255,255,0.5)',
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
    const { height: H } = useWindowDimensions();

    // ── Responsive breakpoints ──────────────────────────────────────────────
    // Small phones (e.g. iPhone SE, older Androids) need a smaller
    // illustration + tighter spacing so the card content and CTA
    // never get pushed off screen or clipped.
    const isTinyScreen = H < 640;
    const isSmallScreen = H < 720;

    const ilZoneHeight = isTinyScreen ? H * 0.24 : isSmallScreen ? H * 0.3 : H * 0.36;
    const titleFontSize = isTinyScreen ? 21 : isSmallScreen ? 23 : 26;
    const titleLineHeight = isTinyScreen ? 26 : isSmallScreen ? 28 : 32;
    const cardPaddingTop = isTinyScreen ? Spacing.sm : Spacing.lg;
    const featurePaddingV = isTinyScreen ? 6 : 9;
    const dividerMarginV = isTinyScreen ? Spacing.sm : Spacing.md;

    const goTo = (idx: number) => setCurrent(idx);

    const handleNext = () => {
        if (current < SLIDES.length - 1) goTo(current + 1);
        else navigation.replace('client');
    };

    const slide = SLIDES[current];

    return (
        <View style={s.root}>
            {/* ── Top bar — on amber ── */}
            <View style={s.topBar}>
                <View style={s.topContent}>
                    <View style={s.topRight}>
                        {/* Step indicator pill — white on amber */}
                        <View style={s.stepPill}>
                            <Text style={s.stepNum}>{slide.step}</Text>
                            <Text style={s.stepOf}> / 03</Text>
                        </View>
                        {current < SLIDES.length - 1 && (
                            <TouchableOpacity
                                style={s.skipBtn}
                                onPress={() => navigation.replace('client')}
                                activeOpacity={0.7}
                            >
                                <Text style={s.skipTxt}>Skip</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* ── Illustration zone — full amber canvas ── */}
            <View style={[s.ilZone, { height: ilZoneHeight }]}>
                {/* Subtle diagonal strip for depth — lighter amber */}
                <View style={s.diagStrip} />
                <SlideIllustration type={slide.illustration} height={ilZoneHeight} />
            </View>

            {/* ── Content card — floats over amber, scrolls if content is tall ── */}
            <View style={s.card}>
                {/* Amber top accent bar */}
                <View style={s.cardBar} />

                <ScrollView
                    style={s.cardScroll}
                    contentContainerStyle={[s.cardScrollContent, { paddingTop: cardPaddingTop }]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Eyebrow */}
                    <View style={s.eyebrowRow}>
                        <View style={s.eyebrowDot} />
                        <Text style={s.eyebrow}>{slide.eyebrow}</Text>
                    </View>

                    {/* Title */}
                    <Text
                        style={[s.title, { fontSize: titleFontSize, lineHeight: titleLineHeight }]}
                    >
                        {slide.title}
                    </Text>

                    {/* Subtitle */}
                    <Text style={s.subtitle}>{slide.subtitle}</Text>

                    {/* Divider */}
                    <View style={[s.cardDivider, { marginVertical: dividerMarginV }]} />

                    {/* Feature rows */}
                    <View style={s.featureList}>
                        {slide.features.map((f, fi) => (
                            <View
                                key={fi}
                                style={[
                                    s.featureRow,
                                    { paddingVertical: featurePaddingV },
                                    fi < slide.features.length - 1 && s.featureRowBorder,
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
                                <Ionicons name="chevron-forward" size={11} color={Colors.border} />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* ── Bottom bar — white tray, always fully visible ── */}
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

                {/* CTA — primary amber button, charcoal text for contrast on amber */}
                <TouchableOpacity style={s.cta} onPress={handleNext} activeOpacity={0.85}>
                    <Text style={s.ctaText}>
                        {current === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
                    </Text>
                    {/* Charcoal icon bubble so it pops against amber button */}
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

// ─── Illustration styles ──────────────────────────────────────────────────────
const il = StyleSheet.create({
    wrap: {
        width: W,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ring: { position: 'absolute', borderWidth: 1 },
    glow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, opacity: 0.65 },

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

    // Floating badges
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
        shadowOpacity: 0.1,
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
        shadowOpacity: 0.08,
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
    verText: { fontSize: 8, fontWeight: Typography.extraBold, letterSpacing: 0.8 },
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
    // ── Root — full amber ──────────────────────────────────────────────────────
    root: {
        flex: 1,
        backgroundColor: Colors.primary,
    },

    // ── Top bar — transparent on amber ────────────────────────────────────────
    topBar: {
        backgroundColor: Colors.primary,
    },
    topContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? Spacing.xl + 24 : Spacing.lg + 16,
        paddingBottom: Spacing.md,
    },
    topRight: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.sm,
    },

    // White pill on amber
    stepPill: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: 'rgba(255,255,255,0.28)',
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
    },
    stepNum: { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.charcoal },
    stepOf: {
        fontSize: Typography.md,
        fontWeight: Typography.regular,
        color: Colors.charcoal + 'AA',
    },

    // Charcoal skip btn on amber
    skipBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radii.full,
        backgroundColor: Colors.charcoal,
        borderWidth: 0,
    },
    skipTxt: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.primary },

    // ── Illustration zone — bare amber canvas ─────────────────────────────────
    ilZone: {
        backgroundColor: Colors.primary, // seamless amber
        overflow: 'hidden',
        position: 'relative',
    },
    diagStrip: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        right: -60,
        height: 140,
        backgroundColor: 'rgba(255,255,255,0.07)',
        transform: [{ rotate: '-7deg' }],
    },

    // ── Content card — white, floats up over amber ────────────────────────────
    card: {
        flex: 1, // fills remaining space above bottom bar
        minHeight: 0, // required on some RN versions so ScrollView inside a flex child can shrink correctly
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: -(Spacing.xl + 6), // overlaps illustration zone
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'hidden',
        ...Shadows.card,
    },
    // Amber top accent bar inside card
    cardBar: {
        position: 'absolute',
        top: 0,
        left: Spacing.xxl,
        right: Spacing.xxl,
        height: 3,
        backgroundColor: Colors.primary,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        zIndex: 1,
    },

    // Scroll area inside the card — lets features/subtitle scroll instead
    // of clipping or sliding behind the bottom bar on short screens.
    cardScroll: {
        flex: 1,
    },
    cardScrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },

    eyebrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.xs,
    },
    eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
    eyebrow: {
        fontSize: Typography.xs,
        fontWeight: Typography.extraBold,
        letterSpacing: Typography.wider,
        color: Colors.primary,
    },

    title: {
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        lineHeight: 20,
        fontWeight: Typography.regular,
    },

    cardDivider: { height: 1, backgroundColor: Colors.divider },

    featureList: { gap: 0 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    featureRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
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

    // ── Bottom bar — white tray, sized by its own content (not flex) so it
    // never gets squeezed or overlapped, and always stays fully visible ──────
    bottomBar: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        alignItems: 'center',
        gap: Spacing.sm,
        ...Shadows.floating,
        marginBottom: Spacing.xl,
    },

    dotsRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
    dot: { height: 7, borderRadius: 3.5 },
    dotActive: { width: 26 },

    // ── CTA — PRIMARY amber, charcoal text + charcoal icon bubble ─────────────
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 15,
        borderRadius: Radii.full,
        backgroundColor: Colors.primary, // golden amber
        gap: Spacing.sm,
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 7,
    },
    ctaText: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal, // charcoal on amber — strong contrast
        letterSpacing: Typography.normal,
    },
    ctaIconBubble: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.charcoal, // charcoal bubble inside amber button
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
