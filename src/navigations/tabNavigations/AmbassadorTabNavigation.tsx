import CustomTabBar from '@/components/bottomTab/custom-tabBar';
import AmbassadorDashboardScreen from '@/features/ambassador/screens/AmbassadorDashboardScreen';
import AmbassadorProfileScreen from '@/features/ambassador/screens/AmbassadorProfileScreen';
import AmbassadorTabsScreen from '@/features/ambassador/screens/AmbassadorTabScreen';
import AmbasssadorVenueBookingScreen from '@/features/ambassador/screens/AmbassadorVenueBookingScreen';
import MyListedVenuesScreen from '@/features/ambassador/screens/MyListedVenueScreen';
import { TabConfig } from '@/types/TabConfig';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export type AmbassadorTabParamList = {
    dashboard: undefined;
    bookings: undefined;
    venues: undefined;
    statics: undefined;
    profile: undefined;
};

const ambassadorTabs: TabConfig[] = [
    {
        name: 'dashboard',
        label: 'Home',
        icon: 'home',
        iconOff: 'home-outline',
    },
    {
        name: 'venues',
        label: 'Browse',
        icon: 'search',
        iconOff: 'search-outline',
    },
    {
        name: 'bookings',
        label: 'Bookings',
        icon: 'calendar',
        iconOff: 'calendar-outline',
        center: true,
    },
    {
        name: 'statics',
        label: 'Rewards',
        icon: 'trophy',
        iconOff: 'trophy-outline',
    },
    {
        name: 'profile',
        label: 'Profile',
        icon: 'person',
        iconOff: 'person-outline',
    },
];

// ─── Client navigator ─────────────────────────────────────────────────────────
const Tabs = createBottomTabNavigator<AmbassadorTabParamList>();

export function AmbassadorTabNavigation() {
    return (
        <Tabs.Navigator
            tabBar={props => <CustomTabBar {...props} tabs={ambassadorTabs} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen name="dashboard" component={AmbassadorDashboardScreen} />

            <Tabs.Screen name="venues" component={MyListedVenuesScreen} />
            <Tabs.Screen name="bookings" component={AmbasssadorVenueBookingScreen} />
            <Tabs.Screen name="statics" component={AmbassadorTabsScreen} />
            <Tabs.Screen name="profile" component={AmbassadorProfileScreen} />
        </Tabs.Navigator>
    );
}
