import { Colors } from "@/theme/theme";

export type CategoryMeta = { key: string; label: string; icon: string; color: string; bg: string };

export const CATEGORIES: CategoryMeta[] = [
    {
        key: 'all',
        label: 'All Services',
        icon: 'grid-outline',
        color: Colors.primary,
        bg: Colors.primaryLight,
    },
    {
        key: 'Catering',
        label: 'Catering',
        icon: 'restaurant-outline',
        color: '#E67E22',
        bg: '#FEF3E2',
    },
    {
        key: 'Makeup & Beauty',
        label: 'Makeup & Beauty',
        icon: 'sparkles-outline',
        color: '#8E44AD',
        bg: '#F5EEF8',
    },
    {
        key: 'Photography',
        label: 'Photography',
        icon: 'camera-outline',
        color: '#16A085',
        bg: '#E8F8F5',
    },
    {
        key: 'Entertainment',
        label: 'Entertainment',
        icon: 'musical-notes-outline',
        color: '#2980B9',
        bg: '#EBF5FB',
    },
    {
        key: 'Decor & Floral',
        label: 'Decor & Floral',
        icon: 'flower-outline',
        color: '#27AE60',
        bg: '#EAFAF1',
    },
    {
        key: 'Security',
        label: 'Security',
        icon: 'shield-checkmark-outline',
        color: '#C0392B',
        bg: '#FDEDEC',
    },
    { key: 'Celebrity', label: 'Celebrity', icon: 'star-outline', color: '#F39C12', bg: '#FEF9E7' },
    {
        key: 'Logistics & Support',
        label: 'Logistics',
        icon: 'car-outline',
        color: '#17A589',
        bg: '#E8F8F5',
    },
];