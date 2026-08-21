import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';

interface SelectFieldProps {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    error?: string;
    placeholder?: string;
}

export default function SelectField({
    label,
    value,
    options,
    onSelect,
    error,
    placeholder = 'Select an option',
}: SelectFieldProps) {
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={[styles.row, !!error && styles.rowError]}
                onPress={() => setOpen(true)}
                activeOpacity={0.75}
            >
                <Text style={[styles.value, !value && styles.placeholder]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.charcoalLight} />
            </TouchableOpacity>
            {!!error && (
                <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                >
                    <View style={styles.sheet}>
                        <View style={styles.handle} />
                        <Text style={styles.sheetTitle}>{label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={item => item}
                            style={styles.list}
                            renderItem={({ item }) => {
                                const selected = item === value;
                                return (
                                    <TouchableOpacity
                                        style={styles.option}
                                        onPress={() => {
                                            onSelect(item);
                                            setOpen(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                selected && styles.optionTextSelected,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                        {selected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={18}
                                                color={Colors.primary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        height: 54,
        paddingHorizontal: Spacing.md,
    },
    rowError: { borderColor: Colors.danger },
    value: { fontSize: 15, color: Colors.charcoal, fontWeight: Typography.medium },
    placeholder: { color: Colors.charcoalLight, fontWeight: Typography.regular },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingTop: 12,
        paddingBottom: Spacing.xl,
        maxHeight: '60%',
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: Spacing.md,
    },
    sheetTitle: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.sm,
    },
    list: { flexGrow: 0 },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    optionText: { fontSize: 14.5, color: Colors.charcoal, fontWeight: Typography.medium },
    optionTextSelected: { color: Colors.primary, fontWeight: Typography.bold },
});
