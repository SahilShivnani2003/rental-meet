import { Typography, Colors, Spacing, Radii, Shadows } from '@/theme/theme';
import { Modal, TouchableOpacity, Text, View, StyleSheet, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TimePickerModalProps {
    visible: boolean;
    timeSlots: string[];
    selectedTime: string;
    onSelect: (time: string) => void;
    onClose: () => void;
}

export default function TimePickerModal({
    visible,
    timeSlots,
    selectedTime,
    onSelect,
    onClose,
}: TimePickerModalProps) {
    const handlePick = (slot: string) => {
        onSelect(slot);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={tp.backdrop} activeOpacity={1} onPress={onClose} />
            <View style={tp.sheet}>
                <View style={tp.handle} />
                <Text style={tp.title}>Select Start Time</Text>

                {timeSlots.length === 0 ? (
                    <Text style={tp.emptyText}>No time slots available for this venue.</Text>
                ) : (
                    <FlatList
                        data={timeSlots}
                        keyExtractor={item => item}
                        numColumns={3}
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 340 }}
                        columnWrapperStyle={{ gap: Spacing.sm }}
                        contentContainerStyle={{ gap: Spacing.sm }}
                        renderItem={({ item }) => {
                            const active = item === selectedTime;
                            return (
                                <TouchableOpacity
                                    style={[tp.slot, active && tp.slotActive]}
                                    onPress={() => handlePick(item)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[tp.slotText, active && tp.slotTextActive]}>
                                        {item}
                                    </Text>
                                    {active && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={14}
                                            color={Colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>
        </Modal>
    );
}

const tp = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingTop: 8,
        paddingBottom: 32,
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        paddingVertical: Spacing.lg,
        textAlign: 'center',
    },
    slot: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 12,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    slotActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    slotText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    slotTextActive: { color: Colors.primary, fontWeight: Typography.bold },
});
