import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Colors, Radii, Spacing, Shadows, Typography } from '@/theme/theme';
import { useGetNotification } from '../hooks/useNotification';
import { Notification, NotificationType } from '../types/Notification';
import Loader from '@/components/UI/loader';

type NotificationScreenProps = NativeStackScreenProps<RootStackParamList, 'notification'>;

// ─── Per-type visual config ────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; bg: string }> = {
    booking_created: {
        icon: 'calendar-outline',
        color: Colors.info,
        bg: Colors.infoLight,
    },
    booking_confirmed: {
        icon: 'checkmark-circle-outline',
        color: Colors.success,
        bg: Colors.successLight,
    },
    booking_completed: {
        icon: 'checkmark-done-circle-outline',
        color: Colors.primaryDark,
        bg: Colors.primaryLight,
    },
    booking_cancelled: {
        icon: 'close-circle-outline',
        color: Colors.danger,
        bg: Colors.dangerLight,
    },
    general: {
        icon: 'notifications-outline',
        color: Colors.charcoalLight,
        bg: Colors.border,
    },
};

function timeAgo(date?: Date | string) {
    if (!date) return '';
    const d = new Date(date);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

// ─── Notification row ──────────────────────────────────────────────────────────
function NotificationItem({
    item,
    onPress,
}: {
    item: Notification;
    onPress: (item: Notification) => void;
}) {
    const cfg = TYPE_CONFIG[item.type ?? 'general'];

    return (
        <TouchableOpacity
            style={[styles.item, !item.isRead && styles.itemUnread]}
            onPress={() => onPress(item)}
            activeOpacity={0.75}
        >
            <View style={[styles.itemIconWrap, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
            </View>

            <View style={styles.itemBody}>
                <View style={styles.itemTitleRow}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.itemMessage} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={30} color={Colors.charcoalLight} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>Updates about your bookings will show up here.</Text>
        </View>
    );
}

// ─── Screen ─────────────────────────────────────────────────────────────────────
export const NotificationScreen = ({ navigation }: NotificationScreenProps) => {
    const { data: notificationData, isLoading, isRefetching, refetch } = useGetNotification();

    const notifications: Notification[] = notificationData?.notifications ?? [];
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const handlePressItem = (item: Notification) => {
        // TODO: wire to a real "mark as read" mutation, then navigate via item.link if present.
    };

    if (isLoading && !notificationData) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerAccentBar} />
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerEyebrow}>UPDATES</Text>
                            <Text style={styles.headerTitle}>Notifications</Text>
                        </View>
                    </View>
                </View>
                <Loader size="md" label="Loading notifications…" style={styles.loader} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerEyebrow}>UPDATES</Text>
                        <Text style={styles.headerTitle}>Notifications</Text>
                    </View>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                        </View>
                    )}
                </View>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item, index) => item._id ?? String(index)}
                contentContainerStyle={
                    notifications.length === 0 ? styles.listEmptyContainer : styles.listContent
                }
                renderItem={({ item }) => (
                    <NotificationItem item={item} onPress={handlePressItem} />
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={<EmptyState />}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            />
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.xl,
        ...Shadows.header,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs,
    },
    headerTitle: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },

    unreadBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    unreadBadgeText: {
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
    },

    loader: { paddingTop: 80 },

    listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 120 },
    listEmptyContainer: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

    item: {
        flexDirection: 'row',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        ...Shadows.card,
    },
    itemUnread: {
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    itemIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemBody: { flex: 1 },
    itemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    itemTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        flexShrink: 1,
    },
    unreadDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: Colors.primary,
    },
    itemMessage: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        lineHeight: 18,
        marginBottom: 4,
    },
    itemTime: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    separator: { height: Spacing.sm },

    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.xl,
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 19,
    },
});
