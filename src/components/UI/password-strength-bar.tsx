import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "../../theme/theme";

export default function PasswordStrength({ password }: { password: string }) {
    if (!password) return null;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const COLORS = [Colors.danger, Colors.warning, Colors.info, Colors.success];
    const LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

    return (
        <View style={ps.wrap}>
            <View style={ps.bars}>
                {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={[ps.bar, { backgroundColor: i < strength ? COLORS[strength - 1] : Colors.border }]} />
                ))}
            </View>
            <Text style={[ps.label, { color: COLORS[strength - 1] ?? Colors.charcoalLight }]}>
                {LABELS[strength - 1] ?? ''}
            </Text>
        </View>
    );
}

const ps = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: -Spacing.xs,
        marginBottom: Spacing.md
    },
    bars: {
        flex: 1,
        flexDirection: 'row',
        gap: 4
    },
    bar: {
        flex: 1,
        height: 4,
        borderRadius: 2
    },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        minWidth: 42,
        textAlign: 'right'
    },
});