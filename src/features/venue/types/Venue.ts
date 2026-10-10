
export interface Venue {
    _id?: string;
    owner?: string; // ObjectId as string
    sku?: string;

    // Listing source and ambassador details
    ambassador?: string;
    addedByAdmin?: string;
    listingSource?: 'owner' | 'ambassador' | 'admin';
    ambassadorListingApprovedAt?: Date;
    ambassadorProfitShareExpiresAt?: Date;

    businessName: string;
    venueType: string[];
    foodType?: 'Veg' | 'Non Veg' | 'Non-Veg' | 'Both';
    description: string;

    capacity:
    | '10-20'
    | '20-30'
    | '30-40'
    | '40-50'
    | '50-100'
    | '100-200'
    | '200-300'
    | '300-400'
    | '400-500'
    | '500-600'
    | '600-700'
    | '700-800'
    | '800-1000'
    | '1000-1500'
    | '1500-2000'
    | 'More than 2000'
    // Additional values accepted by the backend
    | 'Up to 10'
    | '10-25'
    | '25–50'
    | '25-50'
    | '50–100'
    | '100–150'
    | '100-150'
    | '150–200'
    | '150-200'
    | '500-700'
    | '700-1000'
    | '2000+';

    areaSqft: number;

    // Additional venue information
    yearEstablished?: string;
    floor?: string;
    seatingArrangements?: string[];
    servicesAvailable?: string[];

    rulesAndPolicies?: {
        foodPolicy?: string;
        outsideVendors?: string;
        decoration?: string;
        musicNoise?: string;
        alcohol?: string;
        pets?: string;
    };

    cancellationPolicy?: {
        policyType?: string;
        customNoticeDays?: number;
        customRefundPercent?: number;
        moreThanDays?: number;
        moreThanDaysRefund?: number;
        withinDays?: number;
        withinDaysRefund?: number;
        withinHours?: number;
        withinHoursRefund?: number;
        noShowRefund?: number;
    };

    taxSettings?: {
        taxType?: 'GST Included' | 'GST Extra' | 'GST Not Applicable';
        gstRate?: number;
    };

    location: {
        address: string;
        landmark: string;
        state: string;
        city: string;
        village?: string;
        area: string;
        pincode: string;
        googleMapLink: string;
        parkingAvailability: 'Free' | 'Paid' | 'Limited' | 'None';

        // Additional parking details
        parkingDetails?: {
            type?: 'Free' | 'Paid' | 'Limited' | 'None';
            carsCapacity?: number;
            twoWheelerCapacity?: number;
            carCharges?: number;
            twoWheelerCharges?: number;
        };

        nearestBusAuto?: string;
        nearestMetroTrain?: string;
    };

    amenities?: {
        basic?: {
            name?: string;
            available?: boolean;
            type?: 'Included' | 'Paid';
            rate?: number;
            rateType?: 'Fixed' | 'Per Use';
            maxQuantity?: number | null;
        }[];

        beverages?: {
            name?: string;
            available?: boolean;
            ratePerUnit?: number;
            brand?: string;
        }[];

        refreshmentFood?: {
            name?: string;
            available?: boolean;
            ratePerPlate?: number;
            items?: string;
        }[];

        lunchThalis?: {
            thaliType:
            | 'North Indian Thali'
            | 'Punjabi Thali'
            | 'Non-Veg Thali'
            | 'South Indian Thali'
            | 'Gujarati Thali'
            | 'Rajasthani Thali'
            | 'Bengali Thali'
            | 'Maharashtrian Thali'
            | 'Kashmiri Thali'
            | 'Simple/Daily Thali'
            | 'Protein-Packed Thali'
            | 'Festive/Banquet Thali';

            available?: boolean;

            categories?: {
                category: 'Regular Thali' | 'Special Thali' | 'Maharaja Thali';
                ratePerPlate: number;
                numberOfItems: number;
                itemNames: string;
            }[];
        }[];

        kitchenAccess?: {
            available?: boolean;
            type?: 'Included' | 'Paid';
            charges?: number;
        };

        diningArea?: {
            available?: boolean;
            type?: 'Included' | 'Paid';
            charges?: number;
        };

        additional?: {
            name?: string;
            available?: boolean;
            type?: 'Included' | 'Paid';
            charges?: number;
            description?: string;
        }[];
    };

    pricing?: {
        enabledOptions?: {
            perHour?: boolean;
            halfDay?: boolean;
            fullDay?: boolean;
        };

        perHour?: {
            weekday?: number;
            weekend?: number;
        };

        halfDay?: {
            weekday?: number;
            weekend?: number;
        };

        fullDay?: {
            weekday?: number;
            weekend?: number;
        };

        extraHourRate?: {
            weekday?: number;
            weekend?: number;
        };

        // Additional pricing models
        selectedPricingModels?: string[];

        onlyRent?: {
            hourly?: {
                rate?: number;
                extraPerHour?: number;
            };
            halfDay?: {
                rate?: number;
                extraPerHour?: number;
            };
            fullDay?: {
                rate?: number;
                extraPerHour?: number;
            };
        };

        rentWithAmenities?: {
            hourly?: {
                rate?: number;
                extraPerHour?: number;
            };
            halfDay?: {
                rate?: number;
                extraPerHour?: number;
            };
            fullDay?: {
                rate?: number;
                extraPerHour?: number;
            };
        };

        perPax?: {
            withoutFood?: {
                rate?: number;
                minPax?: number;
            };
            breakfastOnly?: {
                rate?: number;
                minPax?: number;
            };
            breakfastLunch?: {
                rate?: number;
                minPax?: number;
            };
            lunchOnly?: {
                rate?: number;
                minPax?: number;
            };
            dinnerOnly?: {
                rate?: number;
                minPax?: number;
            };
            allMeals?: {
                rate?: number;
                minPax?: number;
            };
        };
    };

    customPlatformFee?: {
        enabled?: boolean;
        feeType?: 'fixed' | 'percentage';
        feeValue?: number;
        platformCGSTRate?: number;
        platformSGSTRate?: number;
        percentage?: number;
    };

    customGST?: {
        enabled?: boolean;
        cgstRate?: number;
        sgstRate?: number;
        hsnCode?: string;
        rate?: number;
    };

    availability?: {
        openingTime?: string;
        closingTime?: string;

        // Additional online booking schedule
        onlineBookingSchedule?: {
            enabled?: boolean;
            openingTime?: string;
            closingTime?: string;
        };

        availableDays?: (
            | 'Monday'
            | 'Tuesday'
            | 'Wednesday'
            | 'Thursday'
            | 'Friday'
            | 'Saturday'
            | 'Sunday'
        )[];

        advanceBookingRule?:
        | 'Same day allowed'
        | '24 hours in advance'
        | '48 hours in advance'
        | '1 week in advance'
        | '1 Day';

        blackoutDates?: {
            date?: Date;
            reason?: string;
        }[];

        confirmationHours?: number;
    };

    images?: {
        url?: string;
        category?:
        | 'Featured'
        | 'Exterior'
        | 'Interior'
        | 'Amenities'
        | 'Additional'
        | 'Front / Entrance'
        | 'Front/Entrance'
        | 'Main Hall / Space'
        | 'Main Hall'
        | 'Seating Area'
        | 'Parking'
        | 'Facilities'
        | 'Outdoor Area'
        | 'Other';
        isFeatured?: boolean;
        uploadedAt?: Date;
    }[];

    ownerInfo?: {
        fullName?: string;
        email?: string;
        mobile?: string;
        alternatePhone?: string;
        role?: 'Owner' | 'Manager' | 'Representative';
        hasGST?: boolean;
        gstNumber?: string;

        // Additional GST certificate fields
        gstCertificateUrl?: string;
        gstCertificatePublicId?: string;

        // Authorized person details
        authorisedPerson?: {
            name?: string;
            fullName?: string;
            email?: string;
            phone?: string;
            mobile?: string;
            alternatePhone?: string;
            designation?: string;
            role?: string;
        };
    };

    documents?: {
        idProof?: {
            type?: 'Aadhaar' | 'PAN' | 'Both' | string;
            number?: string;
            frontUrl?: string;
            backUrl?: string;

            // Additional identity document fields
            aadhaarNumber?: string;
            aadhaarFrontUrl?: string;
            aadhaarBackUrl?: string;
            aadhaarFrontPublicId?: string;
            aadhaarBackPublicId?: string;
            panNumber?: string;
            panUrl?: string;
            panPublicId?: string;
            gstDocUrl?: string;
            gstDocPublicId?: string;
        };

        selfieUrl?: string;
        selfiePublicId?: string;

        businessProof?: {
            type?:
            | 'Business Regd. Certificate'
            | 'GST Certificate'
            | 'Trade License'
            | 'Certificate of Incorporation'
            | 'Partnership Deed'
            | 'Udyog Aadhar'
            | 'Other'
            | string;
            documentUrl?: string;
            publicId?: string;
            otherSpecify?: string;
        };

        // Additional verification documents
        propertyProof?: {
            type?: string;
            documentUrl?: string;
            publicId?: string;
            otherSpecify?: string;
        };

        applicableCertificates?: {
            type?: string;
            documentUrl?: string;
            publicId?: string;
            otherSpecify?: string;
        };

        fireNOC?: {
            url?: string;
            publicId?: string;
        };

        fssai?: {
            url?: string;
            publicId?: string;
        };

        verified?: boolean;
    };

    bankDetails?: {
        accountHolderName?: string;
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
        branchName?: string;
        accountType?: 'Savings' | 'Current';
        bankProofUrl?: string;
        bankProofPublicId?: string;

        // Additional Razorpay account fields
        razorpayAccountId?: string;
        linkedAccountId?: string;
        razorpayAccountStatus?: string;
        razorpayAccountCreatedAt?: Date;
        razorpayAccountSyncedAt?: Date;
    };

    // Social media and website links
    socialLinks?: {
        instagram?: string;
        facebook?: string;
        youtube?: string[];
        website?: string;
    };

    // Catering facilities
    cateringFacility?: {
        available?: boolean;
        outsideCateringAllowed?: boolean;

        beverages?: {
            name?: string;
            available?: boolean;
            ratePerUnit?: number;
        }[];

        breakfast?: {
            name?: string;
            available?: boolean;
            ratePerPlate?: number;
            items?: string;
        }[];

        lunchDinner?: {
            name?: string;
            available?: boolean;
            foodType?: 'Veg' | 'Non-Veg' | 'Both';
            ratePerPlate?: number;
            items?: string;
        }[];
    };

    // Additional facilities
    additionalFacilities?: {
        name?: string;
        available?: boolean;
        type?: 'Included' | 'Paid';
        charges?: number;
        description?: string;
    }[];

    termsAccepted: boolean;
    termsAcceptedDate?: Date;

    status?:
    | 'pending'
    | 'provisional'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'resubmitted';

    rejectionReason?: string;

    rejectionHistory?: {
        reason?: string;
        rejectedAt?: Date;
        rejectedBy?: string;
    }[];

    // Additional status and verification fields
    isVerified?: boolean;
    profileCompletion?: number;
    onboardingPhase?: number;
    isProvisional?: boolean;
    suspensionReason?: string;
    statusReason?: string;

    verificationTimeline?: {
        applicationReview?: Date;
        documentVerification?: Date;
        siteVisit?: Date;
        listingActivation?: Date;
    };

    // Audit status history
    statusHistory?: {
        action?: string;
        status?: string;
        isActive?: boolean;
        isBookingStopped?: boolean;
        reason?: string;

        changedBy?: {
            userId?: string;
            name?: string;
            email?: string;
            role?: string;
        };

        ipAddress?: string;
        timestamp?: Date;
    }[];

    // Admin booking controls
    isBookingStopped?: boolean;
    stopBookingReason?: string;
    stoppedBookingAt?: Date;

    isActive?: boolean;

    blockedDates?: {
        date: Date;
        reason?: string;
    }[];

    totalBookings?: number;
    totalEarnings?: number;
    rating?: number;
    reviewCount?: number;

    createdAt?: Date;
    updatedAt?: Date;
}