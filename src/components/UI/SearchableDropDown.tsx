import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';

export type DropdownOption = {
    name: string;
    placeId: string;
};

interface SearchableDropdownProps {
    label: string;
    icon: string;
    placeholder?: string;
    value: string;
    /** Called on every keystroke so the parent can keep a controlled value. */
    onChangeText: (text: string) => void;
    /** Async lookup — e.g. getStates or getCitiesByState. */
    fetchOptions: (query: string) => Promise<DropdownOption[]>;
    /** Called when the user taps a result from the list. */
    onSelect: (option: DropdownOption) => void;
    error?: string;
    disabled?: boolean;
    /** Shown as the placeholder text while disabled (e.g. "Select a state first"). */
    disabledHint?: string;
    minQueryLength?: number;
    debounceMs?: number;
}

export default function SearchableDropdown({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    fetchOptions,
    onSelect,
    error,
    disabled = false,
    disabledHint,
    minQueryLength = 1,
    debounceMs = 350,
}: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(false);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Guards against a slow, stale request overwriting a newer one's results.
    const requestId = useRef(0);

    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    const runSearch = (query: string) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (query.trim().length < minQueryLength) {
            setOptions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const thisRequest = ++requestId.current;

        debounceTimer.current = setTimeout(async () => {
            try {
                const results = await fetchOptions(query);
                if (thisRequest === requestId.current) {
                    setOptions(results);
                }
            } catch {
                if (thisRequest === requestId.current) setOptions([]);
            } finally {
                if (thisRequest === requestId.current) setLoading(false);
            }
        }, debounceMs);
    };

    const handleChangeText = (text: string) => {
        onChangeText(text);
        setIsOpen(true);
        runSearch(text);
    };

    const handleSelect = (option: DropdownOption) => {
        onSelect(option);
        setOptions([]);
        setIsOpen(false);
        Keyboard.dismiss();
    };

    const handleFocus = () => {
        if (disabled) return;
        setIsOpen(true);
        if (value.trim().length >= minQueryLength) runSearch(value);
    };

    const handleBlur = () => {
        // Small delay so a tap on a result registers before the list unmounts.
        setTimeout(() => setIsOpen(false), 150);
    };

    const handleClear = () => {
        onChangeText('');
        setOptions([]);
    };

    const showResults = isOpen && !disabled;
    const showNoMatches =
        showResults && !loading && options.length === 0 && value.trim().length >= minQueryLength;

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>

            <View
                style={[
                    styles.inputRow,
                    !!error && styles.inputRowError,
                    disabled && styles.inputRowDisabled,
                ]}
            >
                <Ionicons
                    name={icon as any}
                    size={17}
                    color={disabled ? Colors.charcoalLight : Colors.charcoalMid}
                />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={handleChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={disabled ? disabledHint ?? placeholder : placeholder}
                    placeholderTextColor={Colors.charcoalLight}
                    editable={!disabled}
                    autoCapitalize="words"
                    autoCorrect={false}
                />
                {loading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                ) : value.length > 0 && !disabled ? (
                    <TouchableOpacity
                        onPress={handleClear}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="close-circle" size={16} color={Colors.charcoalLight} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {!!error && (
                <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {showResults && options.length > 0 && (
                <View style={styles.dropdown}>
                    <ScrollView
                        style={styles.dropdownList}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                    >
                        {options.map((item, index) => (
                            <React.Fragment key={item.placeId}>
                                {index > 0 && <View style={styles.dropdownSep} />}
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => handleSelect(item)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="location-outline"
                                        size={14}
                                        color={Colors.charcoalLight}
                                    />
                                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            </React.Fragment>
                        ))}
                    </ScrollView>
                </View>
            )}

            {showNoMatches && (
                <View style={styles.dropdown}>
                    <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownEmptyText}>No matches found</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        height: 52,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
    },
    inputRowError: { borderColor: Colors.danger },
    inputRowDisabled: { opacity: 0.6 },
    input: {
        flex: 1,
        fontSize: 14,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        paddingVertical: 0,
    },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },
    dropdown: {
        marginTop: Spacing.xs,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        ...Shadows.card,
    },
    dropdownList: { maxHeight: 220 },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 11,
    },
    dropdownItemText: { fontSize: 13.5, color: Colors.charcoal, fontWeight: Typography.medium },
    dropdownSep: { height: 1, backgroundColor: Colors.divider },
    dropdownEmptyText: { fontSize: 12.5, color: Colors.charcoalLight, fontStyle: 'italic' },
});
