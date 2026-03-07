import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii } from '../../theme/theme';

const STEPS = [
    { label: 'Basic Info', icon: 'business-outline' },
    { label: 'Location', icon: 'location-outline' },
    { label: 'Amenities', icon: 'restaurant-outline' },
    { label: 'Pricing', icon: 'logo-usd' },
    { label: 'Photos', icon: 'images-outline' },
    { label: 'Documents', icon: 'document-text-outline' },
    { label: 'Terms', icon: 'checkmark-circle-outline' },
];

interface Props {
    currentStep: number;
}

export default function StepIndicator({ currentStep }: Props) {
    return (
        <View style={s.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.container}
            >
                {STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const completed = stepNum < currentStep;
                    const active = stepNum === currentStep;
                    return (
                        <View key={idx} style={s.stepWrap}>
                            {idx > 0 && (
                                <View
                                    style={[
                                        s.line,
                                        completed || active ? s.lineActive : s.lineInactive,
                                    ]}
                                />
                            )}
                            <View style={s.stepCol}>
                                <View
                                    style={[
                                        s.circle,
                                        completed && s.circleCompleted,
                                        active && s.circleActive,
                                        !completed && !active && s.circleInactive,
                                    ]}
                                >
                                    {completed ? (
                                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                                    ) : (
                                        <Ionicons
                                            name={step.icon as any}
                                            size={16}
                                            color={active ? Colors.charcoal : Colors.charcoalLight}
                                        />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        s.label,
                                        completed && s.labelDone,
                                        active && s.labelActive,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {step.label}
                                </Text>
                            </View>
                            {idx < STEPS.length - 1 && (
                                <View style={[s.line, completed ? s.lineActive : s.lineInactive]} />
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const CIRCLE = 44;
const s = StyleSheet.create({
    wrapper: {
        backgroundColor: Colors.surface,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    container: { paddingHorizontal: Spacing.md, alignItems: 'center' },
    stepWrap: { flexDirection: 'row', alignItems: 'center' },
    stepCol: { alignItems: 'center', width: 72 },
    circle: {
        width: CIRCLE,
        height: CIRCLE,
        borderRadius: CIRCLE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    circleCompleted: { backgroundColor: Colors.success, borderColor: Colors.success },
    circleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    circleInactive: { backgroundColor: Colors.surface, borderColor: Colors.border },
    label: {
        fontSize: Typography.xs,
        fontWeight: Typography.medium,
        color: Colors.charcoalLight,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    labelDone: { color: Colors.success },
    labelActive: { color: Colors.primary, fontWeight: Typography.bold },
    line: { height: 2.5, width: 16, marginBottom: 20 },
    lineActive: { backgroundColor: Colors.primary },
    lineInactive: { backgroundColor: Colors.border },
});
