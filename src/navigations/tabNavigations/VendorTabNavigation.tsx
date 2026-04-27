import ServiceBookingScreen from '@/features/booking/screens/ServiceBookingScreen';
import OtherServicesScreen from '@/features/otherService/screens/OtherServiceScreen';
import { VendorService } from '@/features/otherService/types/VendorService';
import GetQuotationScreen from '@/features/quotation/screens/GetQuotationScreen';
import { TabConfig } from '@/types/TabConfig';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export type VendorTabParamList = {
    dashboard: undefined;
    myService: undefined;
    booking: {
        service: VendorService;
    };
    quotationDownload: {
        service: VendorService;
    };
    profile: undefined;
};

const vendorTabConfig: TabConfig[] = [
    {
        name: 'dashboard',
        label: 'Dashboard',
        icon: 'grid',
        iconOff: 'grid-outline',
    },
    {
        name: 'myService',
        label: 'My Services',
        icon: 'briefcase',
        iconOff: 'briefcase-outline',
    },
    {
        name: 'booking',
        label: 'Bookings',
        icon: 'calendar',
        iconOff: 'calendar-outline',
        badge: true, // useful for showing new bookings
    },
    {
        name: 'quotationDownload',
        label: 'Quotations',
        icon: 'download',
        iconOff: 'download-outline',
    },
    {
        name: 'profile',
        label: 'Profile',
        icon: 'person',
        iconOff: 'person-outline',
    },
];

const Tab = createBottomTabNavigator<VendorTabParamList>();

export function VendorTabNavigation() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="myService" component={OtherServicesScreen} />
            <Tab.Screen name="booking" component={ServiceBookingScreen} />
            <Tab.Screen name="quotationDownload" component={GetQuotationScreen} />
        </Tab.Navigator>
    );
}
