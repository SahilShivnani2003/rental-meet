import { Typography, Colors, Shadows } from "@/theme/theme";
import { useRef, useEffect } from "react";
import { View, PanResponder, Text, StyleSheet } from "react-native";

// ── Dual-handle Range Slider ──────────────────────────────────────────────────
export interface RangeSliderProps {
    min: number;
    max: number;
    step: number;
    low: number;
    high: number;
    onValueChange: (low: number, high: number) => void;
}

export default function RangeSlider({ min, max, step, low, high, onValueChange }: RangeSliderProps) {
    const sliderRef = useRef<View>(null);
    const sliderWidth = useRef(0);
    const lowRef = useRef(low);
    const highRef = useRef(high);

    // Keep refs in sync
    useEffect(() => {
        lowRef.current = low;
    }, [low]);
    useEffect(() => {
        highRef.current = high;
    }, [high]);

    const clampStep = (val: number) => {
        const stepped = Math.round(val / step) * step;
        return Math.max(min, Math.min(max, stepped));
    };

    const xToValue = (x: number) => {
        const ratio = Math.max(0, Math.min(1, x / sliderWidth.current));
        return clampStep(min + ratio * (max - min));
    };

    const valueToPercent = (val: number) => ((val - min) / (max - min)) * 100;

    // Low thumb pan
    const lowPan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {},
            onPanResponderMove: (_, gs) => {
                const trackLeft = 0;
                const newVal = xToValue(gs.moveX - trackLeft);
                if (newVal < highRef.current) {
                    onValueChange(newVal, highRef.current);
                }
            },
        }),
    ).current;

    // High thumb pan
    const highPan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {},
            onPanResponderMove: (_, gs) => {
                const newVal = xToValue(gs.moveX);
                if (newVal > lowRef.current) {
                    onValueChange(lowRef.current, newVal);
                }
            },
        }),
    ).current;

    const lowPct = valueToPercent(low);
    const highPct = valueToPercent(high);

    const formatPrice = (val: number) =>
        val >= 100000
            ? '₹1L+'
            : val === 0
            ? '₹0'
            : `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;

    return (
        <View style={rs.wrap}>
            {/* Labels */}
            <View style={rs.labelsRow}>
                <Text style={rs.rangeLabel}>{formatPrice(low)}</Text>
                <Text style={rs.rangeSep}>—</Text>
                <Text style={rs.rangeLabel}>{formatPrice(high)}</Text>
            </View>

            {/* Track */}
            <View
                ref={sliderRef}
                style={rs.trackOuter}
                onLayout={e => {
                    sliderWidth.current = e.nativeEvent.layout.width;
                }}
            >
                {/* Inactive track */}
                <View style={rs.trackInactive} />

                {/* Active track fill */}
                <View
                    style={[rs.trackActive, { left: `${lowPct}%`, right: `${100 - highPct}%` }]}
                />

                {/* Low thumb */}
                <View style={[rs.thumb, { left: `${lowPct}%` }]} {...lowPan.panHandlers}>
                    <View style={rs.thumbInner} />
                </View>

                {/* High thumb */}
                <View style={[rs.thumb, { left: `${highPct}%` }]} {...highPan.panHandlers}>
                    <View style={rs.thumbInner} />
                </View>
            </View>

            {/* Min / Max hint */}
            <View style={rs.hintRow}>
                <Text style={rs.hint}>₹0</Text>
                <Text style={rs.hint}>₹1L+</Text>
            </View>
        </View>
    );
}

const rs = StyleSheet.create({
    wrap: { gap: 4 },
    labelsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 6,
    },
    rangeLabel: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: -0.2,
    },
    rangeSep: { fontSize: 12, color: Colors.charcoalLight },
    trackOuter: {
        height: 36,
        justifyContent: 'center',
        position: 'relative',
        marginHorizontal: 10,
    },
    trackInactive: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
    },
    trackActive: {
        position: 'absolute',
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    thumb: {
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: 13,
        marginLeft: -13,
        top: 5,
        backgroundColor: Colors.surface,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    thumbInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    hintRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        marginHorizontal: 10,
    },
    hint: { fontSize: 10, color: Colors.charcoalLight, fontWeight: Typography.medium },
});
