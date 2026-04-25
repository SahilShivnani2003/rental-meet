import { Booking } from "@/features/booking/types/Booking";
import { ClientTabParamList } from "@/navigations/tabNavigations/ClientTabNavigation";
import { OwnerTabParamList } from "@/navigations/tabNavigations/OwnerTabNavigation";
import { tabParamList } from "@/navigations/tabNavigations/TabNavigation";
import { Venue, SelectedAmenityItem } from "@/screens/venue-detail";
import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
    splash: undefined;
    login: undefined;
    main: NavigatorScreenParams<tabParamList> | undefined;
    registerType: undefined;
    client: NavigatorScreenParams<ClientTabParamList> | undefined;
    owner: NavigatorScreenParams<OwnerTabParamList> | undefined;
    register: {
        role: string;
    };
    venueDetail: {
        venue: any;
    };
    category: undefined;
    booking: {
        venue: Venue;
        selectedAmenities?: SelectedAmenityItem[];
        amenitiesTotal?: number;
        preselectedDurationHours?: number;
        preselectedDurationType?: string;
    };
    bookingDetail: {
        bookingId: string;
    };
    onBoarding: undefined;
    addVenue: undefined;
    updateVenue: {
        venueId: string | undefined;
    };
    vDetail: {
        venueId: string;
    };
    modifyBooking:{
        bookingId: string; 
        booking: Booking;
    }
};