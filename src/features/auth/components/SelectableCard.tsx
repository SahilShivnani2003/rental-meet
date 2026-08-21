import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radii, Spacing, Typography } from '@/theme/theme';

interface SelectableCardProps {
    label: string;
    selected: boolean;
    onToggle: () => void;
}

export default function SelectableCard({ label, selected, onToggle }: SelectableCardProps) {
    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected]}
            onPress={onToggle}
            activeOpacity={0.75}
        >
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
                {label}
            </Text>
            <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={19}
                color={selected ? Colors.primary : Colors.border}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        paddingVertical: 14,
        paddingHorizontal: Spacing.md,
    },
    cardSelected: {
        backgroundColor: Colors.primaryLight + '55',
        borderColor: Colors.primary,
    },
    label: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    labelSelected: { color: Colors.primaryDark },
});
