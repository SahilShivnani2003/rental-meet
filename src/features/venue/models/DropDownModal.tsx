import { Colors, Radii, Spacing, Shadows, Typography } from '@/theme/theme';
import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface DropdownModalProps {
    visible: boolean;
    title: string;
    options: { label: string; value: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
    searchable?: boolean;
}

export default function DropdownModal({
    visible,
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
    searchable = false,
}: DropdownModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredOptions = searchable
        ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={onClose} />
            <View style={styles.dropdownSheet}>
                <View style={styles.dropdownHandle} />
                <Text style={styles.dropdownTitle}>{title}</Text>
                {searchable && (
                    <View style={styles.dropdownSearchWrap}>
                        <Ionicons
                            name="search"
                            size={16}
                            color={Colors.charcoalLight}
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            style={styles.dropdownSearchInput}
                            placeholder="Search..."
                            placeholderTextColor={Colors.charcoalLight}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons
                                    name="close-circle"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                <FlatList
                    data={filteredOptions}
                    keyExtractor={item => item.value}
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 400 }}
                    renderItem={({ item }) => {
                        const isActive = item.value === selectedValue;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.dropdownOption,
                                    isActive && styles.dropdownOptionActive,
                                ]}
                                onPress={() => {
                                    onSelect(item.value);
                                    onClose();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.dropdownOptionText,
                                        isActive && styles.dropdownOptionTextActive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {isActive && (
                                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    dropdownBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    dropdownSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingBottom: 32,
        ...Shadows.floating,
    },
    dropdownHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    dropdownTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.md,
    },
    dropdownSearchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    dropdownSearchInput: { flex: 1, fontSize: Typography.base, color: Colors.charcoal },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        paddingHorizontal: 10,
        borderRadius: Radii.md,
        marginBottom: 2,
    },
    dropdownOptionActive: { backgroundColor: Colors.primaryLight },
    dropdownOptionText: {
        fontSize: Typography.md,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    dropdownOptionTextActive: { color: Colors.primary, fontWeight: Typography.bold },
});
