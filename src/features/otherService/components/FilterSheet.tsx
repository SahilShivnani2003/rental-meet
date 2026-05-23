import { Colors, Spacing, Typography, Radii, Shadows } from "@/theme/theme";
import { useRef, useEffect } from "react";
import { Animated, Modal, View, TouchableOpacity, StyleSheet, Text, ScrollView, TextInput } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { CATEGORIES } from "../data/Category";

export function FilterSheet({
    visible,
    onClose,
    search,
    setSearch,
    city,
    setCity,
    selectedCat,
    setSelectedCat,
    onReset,
}: {
    visible: boolean;
    onClose: () => void;
    search: string;
    setSearch: (v: string) => void;
    city: string;
    setCity: (v: string) => void;
    selectedCat: string;
    setSelectedCat: (v: string) => void;
    onReset: () => void;
}) {
    const slideAnim = useRef(new Animated.Value(600)).current;

    useEffect(() => {
        if (visible) {
            slideAnim.setValue(600);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 18,
                bounciness: 4,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(
            onClose,
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={fs.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <Animated.View style={[fs.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={fs.handle} />
                    <View style={fs.header}>
                        <View style={fs.headerLeft}>
                            <Ionicons name="options-outline" size={18} color={Colors.charcoal} />
                            <Text style={fs.headerTitle}>Filters</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={fs.body}
                    >
                        {/* Search */}
                        <Text style={fs.label}>Search</Text>
                        <View style={fs.inputWrap}>
                            <Ionicons
                                name="search-outline"
                                size={16}
                                color={Colors.charcoalLight}
                            />
                            <TextInput
                                style={fs.input}
                                placeholder="Search vendors..."
                                placeholderTextColor={Colors.charcoalLight}
                                value={search}
                                onChangeText={setSearch}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <Ionicons
                                        name="close-circle"
                                        size={15}
                                        color={Colors.charcoalLight}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* City */}
                        <Text style={[fs.label, { marginTop: Spacing.lg }]}>City</Text>
                        <View style={fs.inputWrap}>
                            <Ionicons
                                name="location-outline"
                                size={16}
                                color={Colors.charcoalLight}
                            />
                            <TextInput
                                style={fs.input}
                                placeholder="e.g. Bhopal, Mumbai..."
                                placeholderTextColor={Colors.charcoalLight}
                                value={city}
                                onChangeText={setCity}
                            />
                        </View>

                        {/* Service category */}
                        <Text style={[fs.label, { marginTop: Spacing.lg }]}>Service Category</Text>
                        {CATEGORIES.map(cat => {
                            const active = selectedCat === cat.key;
                            return (
                                <TouchableOpacity
                                    key={cat.key}
                                    style={[
                                        fs.catRow,
                                        active && {
                                            backgroundColor: cat.bg,
                                            borderColor: cat.color + '55',
                                        },
                                    ]}
                                    onPress={() => setSelectedCat(cat.key)}
                                    activeOpacity={0.8}
                                >
                                    <View
                                        style={[
                                            fs.catIcon,
                                            {
                                                backgroundColor: active
                                                    ? cat.color + '22'
                                                    : Colors.background,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={cat.icon as any}
                                            size={16}
                                            color={cat.color}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            fs.catLabel,
                                            active && {
                                                color: cat.color,
                                                fontWeight: Typography.bold,
                                            },
                                        ]}
                                    >
                                        {cat.label}
                                    </Text>
                                    {active && (
                                        <Ionicons name="checkmark" size={16} color={cat.color} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}

                        {/* Reset */}
                        <TouchableOpacity
                            style={fs.resetBtn}
                            onPress={() => {
                                onReset();
                                handleClose();
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="close-circle-outline"
                                size={16}
                                color={Colors.charcoalLight}
                            />
                            <Text style={fs.resetText}>Reset Filters</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const fs = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingTop: 12,
        maxHeight: '88%',
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 17, fontWeight: Typography.extraBold, color: Colors.charcoal },
    body: { padding: Spacing.xl, paddingBottom: 40 },
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 1.6,
        marginBottom: Spacing.sm,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    input: { flex: 1, fontSize: 14, color: Colors.charcoal },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: Radii.md,
        marginBottom: 6,
        borderWidth: 1.5,
        borderColor: 'transparent',
        backgroundColor: Colors.background,
    },
    catIcon: {
        width: 32,
        height: 32,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catLabel: { flex: 1, fontSize: 14, color: Colors.charcoalMid, fontWeight: Typography.medium },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: Spacing.xl,
        paddingVertical: 14,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    resetText: { fontSize: 14, fontWeight: Typography.semiBold, color: Colors.charcoalLight },
});
