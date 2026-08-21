import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Typography } from '@/theme/theme';

interface CheckboxProps {
    checked: boolean;
    onToggle: () => void;
    label?: string;
    labelStyle?: object;
    error?: boolean;
}

export default function Checkbox({ checked, onToggle, label, labelStyle, error }: CheckboxProps) {
    return (
        <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.75}>
            <View
                style={[
                    styles.box,
                    checked && styles.boxChecked,
                    error && !checked && styles.boxError,
                ]}
            >
                {checked && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            {!!label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    box: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    boxError: {
        borderColor: Colors.danger,
    },
    label: {
        flex: 1,
        fontSize: 13.5,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
    },
});
