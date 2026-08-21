import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Typography } from '@/theme/theme';

interface StepIndicatorProps {
    steps: string[];
    currentIndex: number;
}

export default function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
    return (
        <View style={styles.wrap}>
            <View style={styles.row}>
                {steps.map((_, i) => {
                    const isDone = i < currentIndex;
                    const isActive = i === currentIndex;
                    return (
                        <View key={i} style={styles.stepUnit}>
                            <View
                                style={[
                                    styles.dot,
                                    isDone && styles.dotDone,
                                    isActive && styles.dotActive,
                                ]}
                            >
                                {isDone ? (
                                    <Ionicons name="checkmark" size={13} color={Colors.white} />
                                ) : (
                                    <Text style={[styles.dotText, isActive && styles.dotTextActive]}>
                                        {i + 1}
                                    </Text>
                                )}
                            </View>
                            {i < steps.length - 1 && (
                                <View style={[styles.line, isDone && styles.lineDone]} />
                            )}
                        </View>
                    );
                })}
            </View>
            <Text style={styles.currentLabel}>{steps[currentIndex]}</Text>
        </View>
    );
}

const DOT_SIZE = 26;

const styles = StyleSheet.create({
    wrap: { marginBottom: Spacing.lg },
    row: { flexDirection: 'row', alignItems: 'center' },
    stepUnit: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotDone: { backgroundColor: Colors.primary },
    dotActive: { backgroundColor: Colors.primaryDark },
    dotText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoalLight },
    dotTextActive: { color: Colors.white },
    line: { flex: 1, height: 2, backgroundColor: Colors.border },
    lineDone: { backgroundColor: Colors.primary },
    currentLabel: {
        marginTop: Spacing.sm,
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        textAlign: 'center',
    },
});
