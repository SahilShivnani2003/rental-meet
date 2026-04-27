import CustomTabBar from '@/components/bottomTab/custom-tabBar';
import VendorBookingsScreen from '@/features/booking/screens/VendorBookingScreen';
import VendorDashboardScreen from '@/features/dashboard/screens/VendorDashboardScreen';
import { VendorService } from '@/features/otherService/types/VendorService';
import VendorProfileScreen from '@/features/profile/screen/VendorProfileScreen';
import GetQuotationScreen from '@/features/quotation/screens/GetQuotationScreen';
import QuotationDownloadsScreen from '@/features/quotation/screens/QuotationDownloadScreen';
import VendorServicesScreen from '@/features/vendor/screens/VendorServiceScreen';
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
        center: true, // useful for showing new bookings
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
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={props => <CustomTabBar {...props} tabs={vendorTabConfig} />}
        >
            <Tab.Screen name="dashboard" component={VendorDashboardScreen} />
            <Tab.Screen name="myService" component={VendorServicesScreen} />
            <Tab.Screen name="booking" component={VendorBookingsScreen} />
            <Tab.Screen name="quotationDownload" component={QuotationDownloadsScreen} />
            <Tab.Screen name="profile" component={VendorProfileScreen} />
        </Tab.Navigator>
    );
}
