import { Colors, Radii, Spacing, Shadows, Typography } from "@/theme/theme";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { CategoryMeta } from "../data/Category";
export function CategoryTile({
    cat,
    selected,
    onPress,
}: {
    cat: CategoryMeta;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[ct.tile, selected && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View
                style={[
                    ct.iconWrap,
                    { backgroundColor: selected ? 'rgba(255,255,255,0.22)' : cat.bg },
                ]}
            >
                <Ionicons
                    name={cat.icon as any}
                    size={22}
                    color={selected ? Colors.white : cat.color}
                />
            </View>
            <Text
                style={[ct.label, { color: selected ? Colors.white : Colors.charcoal }]}
                numberOfLines={2}
            >
                {cat.label}
            </Text>
        </TouchableOpacity>
    );
}

const ct = StyleSheet.create({
    tile: {
        width: 86,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: Radii.xl,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        marginRight: Spacing.sm,
        gap: 8,
        ...Shadows.card,
    },
    iconWrap: {
        width: 46,
        height: 46,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: { fontSize: 10.5, fontWeight: Typography.bold, textAlign: 'center', lineHeight: 14 },
});
