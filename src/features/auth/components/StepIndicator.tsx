import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Typography } from '@/theme/theme';

interface StepIndicatorProps {
    steps: string[];
    currentIndex: number;
}

const DOT_SIZE = 26;
const ACTIVE_DOT_SIZE = 30;

export default function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
    // Pop the active dot slightly whenever the step changes.
    const activeScale = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        activeScale.setValue(0.85);
        Animated.spring(activeScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
        }).start();
    }, [currentIndex]);

    return (
        <View style={styles.wrap}>
            <View style={styles.row}>
                {steps.map((_, i) => {
                    const isDone = i < currentIndex;
                    const isActive = i === currentIndex;
                    return (
                        <View key={i} style={styles.stepUnit}>
                            <Animated.View
                                style={[
                                    styles.dot,
                                    isDone && styles.dotDone,
                                    isActive && styles.dotActive,
                                    isActive && {
                                        transform: [{ scale: activeScale }],
                                    },
                                ]}
                            >
                                {isDone ? (
                                    <Ionicons name="checkmark" size={13} color={Colors.white} />
                                ) : (
                                    <Text
                                        style={[styles.dotText, isActive && styles.dotTextActive]}
                                    >
                                        {i + 1}
                                    </Text>
                                )}
                            </Animated.View>
                            {i < steps.length - 1 && (
                                <View style={[styles.line, isDone && styles.lineDone]} />
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: Spacing.lg },
    row: { flexDirection: 'row', alignItems: 'center' },
    stepUnit: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dotActive: {
        width: ACTIVE_DOT_SIZE,
        height: ACTIVE_DOT_SIZE,
        borderRadius: ACTIVE_DOT_SIZE / 2,
        backgroundColor: Colors.charcoal,
        borderColor: Colors.charcoal,
    },
    dotText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoalLight },
    dotTextActive: { color: Colors.white, fontSize: 13 },
    line: { flex: 1, height: 2, backgroundColor: Colors.border },
    lineDone: { backgroundColor: Colors.primary },
});
