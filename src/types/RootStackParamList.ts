import { Booking } from "@/features/booking/types/Booking";
import { VendorService } from "@/features/otherService/types/VendorService";
import { SelectedAmenityItem } from "@/features/venue/models/BookingSheet";
import { Venue } from "@/features/venue/types/Venue";
import { ClientTabParamList } from "@/navigations/tabNavigations/ClientTabNavigation";
import { OwnerTabParamList } from "@/navigations/tabNavigations/OwnerTabNavigation";
import { VendorTabParamList } from "@/navigations/tabNavigations/VendorTabNavigation";
import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
    splash: undefined;
    login: undefined;
    registerType: undefined;
    forgotPassword: undefined;
    client: NavigatorScreenParams<ClientTabParamList> | undefined;
    owner: NavigatorScreenParams<OwnerTabParamList> | undefined;
    vendor: NavigatorScreenParams<VendorTabParamList> | undefined;
    register: {
        role: string;
    };
    venueDetail: {
        venue: any;
    };
    category: undefined;
    venueBooking: {
        venue: Venue;
        selectedAmenities?: SelectedAmenityItem[];
        amenitiesTotal?: number;
        preselectedDurationHours?: number;
        preselectedDurationType?: string;
    };
    venueBookingDetail: {
        bookingId: string;
    };
    onBoarding: undefined;
    addVenue: undefined;
    updateVenue: {
        venueId: string;
    };
    modifyVenueBooking: {
        bookingId: string;
        booking: Booking;
    };
    vendorDetail: {
        service: VendorService;
    };
    serviceBooking: {
        service: any;
        selectedPackages?: {
            name: string;
            price: number;
            unit?: string;
            quantity: number;
            amount: number;
        }[];
    };
    getServiceQuotation: {
        service: any;
    };
    addVendorService: undefined;
    updateVendorService: {
        serviceId: string;
        initialData: VendorService;
    };
    serviceBookingDetail: {
        bookingData: any
    },
    referral:undefined;
};