import { Colors } from "@/theme/theme";

interface roleMeta {
    label: string;
    icon: string;
    color: string;
    bg: string;
}

export const ROLE_META: Record<string, roleMeta> = {
    client: {
        label: 'Client',
        icon: 'person',
        color: Colors.info,
        bg: Colors.infoLight,
    },
    owner: {
        label: 'Space Owner',
        icon: 'business',
        color: Colors.primary,
        bg: Colors.primaryLight,
    },
    vendor: {
        label: 'Service Vendor',
        icon: 'construct',
        color: Colors.success,
        bg: Colors.successLight,
    },
};