import { Typography, Colors, Spacing, Radii } from "@/theme/theme";
import { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function TimePicker({
    value,
    onChange,
    color,
}: {
    value: string;
    onChange: (t: string) => void;
    color: string;
}) {
    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];
    const periods = ['AM', 'PM'];

    const [selH, setSelH] = useState('10');
    const [selM, setSelM] = useState('00');
    const [selP, setSelP] = useState('AM');

    useEffect(() => {
        onChange(`${selH}:${selM} ${selP}`);
    }, [selH, selM, selP]);

    const Drum = ({
        items,
        selected,
        onSelect,
    }: {
        items: string[];
        selected: string;
        onSelect: (v: string) => void;
    }) => (
        <ScrollView
            style={tp.drum}
            showsVerticalScrollIndicator={false}
            snapToInterval={36}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: 36 }}
        >
            {items.map(item => (
                <TouchableOpacity
                    key={item}
                    style={[tp.drumItem, selected === item && { backgroundColor: color + '18' }]}
                    onPress={() => onSelect(item)}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            tp.drumText,
                            selected === item && { color, fontWeight: Typography.extraBold, fontSize: 17 },
                        ]}
                    >
                        {item}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    return (
        <View style={tp.root}>
            <View style={[tp.highlight, { borderColor: color + '40', backgroundColor: color + '08' }]} />
            <View style={tp.drums}>
                <Drum items={hours} selected={selH} onSelect={setSelH} />
                <Text style={tp.sep}>:</Text>
                <Drum items={minutes} selected={selM} onSelect={setSelM} />
                <View style={tp.periodDrum}>
                    {periods.map(p => (
                        <TouchableOpacity
                            key={p}
                            style={[tp.periodBtn, selP === p && { backgroundColor: color, borderColor: color }]}
                            onPress={() => setSelP(p)}
                        >
                            <Text style={[tp.periodText, selP === p && { color: Colors.white }]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <View style={[tp.selectedBadge, { borderColor: color + '30', backgroundColor: color + '10' }]}>
                <Ionicons name="time-outline" size={13} color={color} />
                <Text style={[tp.selectedText, { color }]}>{selH}:{selM} {selP}</Text>
            </View>
        </View>
    );
}

const tp = StyleSheet.create({
    root: {
        marginTop: Spacing.sm,
        borderRadius: Radii.lg,
        overflow: 'hidden',
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: Spacing.sm,
    },
    drums: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 108,
        gap: 4,
    },
    drum: {
        width: 56,
        height: 108,
    },
    drumItem: {
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.sm,
    },
    drumText: {
        fontSize: 15,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    sep: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: 4,
        width: 14,
        textAlign: 'center',
    },
    highlight: {
        position: 'absolute',
        top: '50%' as any,
        left: Spacing.sm,
        right: Spacing.sm,
        height: 36,
        marginTop: -2,
        borderRadius: Radii.sm,
        borderWidth: 1,
        zIndex: 0,
    },
    periodDrum: {
        gap: 6,
        marginLeft: 8,
    },
    periodBtn: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: Radii.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    periodText: {
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'center',
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    selectedText: {
        fontSize: 13,
        fontWeight: Typography.extraBold,
    },
});