import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export type OwnerStatConfig = {
    label: string;
    value: number;
    color: string;
    bg: string;
    borderColor: string;
};

export default function OwnerStatCard({
    stat,
    active,
    onPress,
}: {
    stat: OwnerStatConfig;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.ownerStatCard,
                { borderColor: active ? stat.color : Colors.border },
                active && { backgroundColor: stat.bg },
            ]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Text style={[styles.ownerStatValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.ownerStatLabel}>{stat.label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    ownerStatCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        alignItems: 'center',
        borderWidth: 1.5,
        ...Shadows.card,
    },
    ownerStatValue: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        letterSpacing: -0.5,
        marginBottom: 3,
    },
    ownerStatLabel: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        textAlign: 'center',
    },
    
});
