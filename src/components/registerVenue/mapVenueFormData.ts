import { VenueFormData, Venue } from '../../types/venue.type';

/**
 * Maps backend Venue data to frontend VenueFormData structure
 * This allows pre-filling the form when updating an existing venue
 */
export function mapVenueToFormData(venue: Venue): VenueFormData {
    // Helper to format time (e.g., "09:00 AM")
    const formatTime = (time: string): string => {
        if (!time) return '';
        // If already formatted, return as is
        if (time.includes('AM') || time.includes('PM')) return time;
        // Otherwise, assume it's in 24h format and convert
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    // Helper to convert number to string
    const toStr = (n: number | undefined): string => (n != null ? String(n) : '');

    // Helper to get week price as string object
    const toWeekPriceStr = (wp: { weekday?: number; weekend?: number } | undefined) => ({
        weekday: wp?.weekday != null ? String(wp.weekday) : '',
        weekend: wp?.weekend != null ? String(wp.weekend) : '',
    });

    return {
        // ── Step 1: Basic Info ────────────────────────────────────────────────
        basic: {
            businessName: venue.businessName || '',
            venueTypes: Array.isArray(venue.venueType) ? venue.venueType : [],
            description: venue.description || '',
            capacity: venue.capacity || 'Select capacity range',
            areaSqft: toStr(venue.areaSqft),
        },

        // ── Step 2: Location ──────────────────────────────────────────────────
        location: {
            address: venue.location?.address || '',
            landmark: venue.location?.landmark || '',
            city: venue.location?.city || '',
            area: venue.location?.area || '',
            state: venue.location?.state || '',
            village: venue.location?.village || '',
            pincode: venue.location?.pincode || '',
            googleMapLink: venue.location?.googleMapLink || '',
            parkingAvailability: venue.location?.parkingAvailability || 'Select parking type',
            nearestBusAuto: venue.location?.nearestBusAuto || '',
            nearestMetroTrain: venue.location?.nearestMetroTrain || '',
        },

        // ── Step 3: Amenities ─────────────────────────────────────────────────
        amenities: {
            // Map basic amenities back to form structure
            basic: mapBasicAmenities(venue.amenities?.basic || []),

            // Map beverages
            beverages: mapBeverages(venue.amenities?.beverages || []),

            // Map refreshment food
            refreshmentFood: mapRefreshmentFood(venue.amenities?.refreshmentFood || []),

            // Map lunch thalis
            lunchThalis: mapLunchThalis(venue.amenities?.lunchThalis || []),

            // Map facilities
            kitchenAccess: mapFacility(venue.amenities?.kitchenAccess),
            diningArea: mapFacility(venue.amenities?.diningArea),

            // Map additional amenities
            additional: mapAdditional(venue.amenities?.additional || []),
        },

        // ── Step 4: Pricing ───────────────────────────────────────────────────
        pricing: {
            prices: {
                perHour: toWeekPriceStr(venue.pricing?.perHour),
                halfDay: toWeekPriceStr(venue.pricing?.halfDay),
                fullDay: toWeekPriceStr(venue.pricing?.fullDay),
                extraHour: toWeekPriceStr(venue.pricing?.extraHourRate),
            },
            openTime: formatTime(venue.availability?.openingTime || ''),
            closeTime: formatTime(venue.availability?.closingTime || ''),
            availDays: Array.isArray(venue.availability?.availableDays)
                ? venue.availability.availableDays
                : [],
            advanceBooking: venue.availability?.advanceBookingRule || 'Select option',
            blackoutDate: venue.availability?.blackoutDates?.[0] || '',
        },

        // ── Step 5: Photos ────────────────────────────────────────────────────
        photos: {
            uploadedImages: Array.isArray(venue.images)
                ? venue.images.map(img => ({
                    url: img.url || '',
                    publicId: img.publicId || '',
                    sectionKey: categoryToSectionKey(img.category || ''),
                }))
                : [],
        },

        // ── Step 6: Documents ─────────────────────────────────────────────────
        documents: {
            fullName: venue.ownerInfo?.fullName || '',
            email: venue.ownerInfo?.email || '',
            mobile: venue.ownerInfo?.mobile || '',
            altMobile: venue.ownerInfo?.alternatePhone || '',
            role: venue.ownerInfo?.role || 'Select role',
            hasGST: venue.ownerInfo?.hasGST || false,
            gstNumber: venue.ownerInfo?.gstNumber || '',
            idType: venue.documents?.idProof?.type === 'Aadhaar' ? 'aadhaar' : 'pan',
            idNumber: venue.documents?.idProof?.number || '',
            uploads: buildUploadsMap(venue),
            uploadedDocs: buildUploadedDocs(venue),
            bizProofType: venue.documents?.businessProof?.type || 'Select type',
            accountHolder: venue.bankDetails?.accountHolderName || '',
            accountNumber: venue.bankDetails?.accountNumber || '',
            ifsc: venue.bankDetails?.ifscCode || '',
            bankName: venue.bankDetails?.bankName || '',
            branchName: venue.bankDetails?.branchName || '',
            accountType: venue.bankDetails?.accountType || 'Select type',
        },

        // ── Step 7: Terms ─────────────────────────────────────────────────────
        terms: {
            agreed: venue.termsAccepted || false,
            confirmationHours: (venue.availability?.confirmationHours as 1 | 2 | 3) || 2,
        },
    };
}

// ── Helper mappers ────────────────────────────────────────────────────────────

function mapBasicAmenities(amenities: any[]) {
    // Start with initial structure (all amenities)
    const initialAmenities = [
        { id: 'firstAid', name: 'First Aid Box', locked: true, isDefault: false },
        { id: 'fireSafety', name: 'Fire & Safety', locked: true, isDefault: false },
        { id: 'wifi', name: 'High-Speed WiFi', locked: false, isDefault: true },
        { id: 'ac', name: 'Air Conditioning', locked: false, isDefault: true },
        { id: 'projector', name: 'Projector', locked: false, isDefault: false },
        { id: 'projScreen', name: 'Projection Screen', locked: false, isDefault: false },
        { id: 'whiteboard', name: 'Whiteboard', locked: false, isDefault: false },
        { id: 'soundSystem', name: 'Sound System', locked: false, isDefault: false },
        { id: 'mic', name: 'Microphone', locked: false, isDefault: false },
        { id: 'tv', name: 'LED / Smart TV', locked: false, isDefault: false },
        { id: 'videoConf', name: 'Video Conferencing', locked: false, isDefault: false },
        { id: 'confPhone', name: 'Conference Phone', locked: false, isDefault: false },
        { id: 'seating', name: 'Comfortable Seating', locked: false, isDefault: false },
        { id: 'printing', name: 'Printing / Photocopy', locked: false, isDefault: false },
    ];

    return initialAmenities.map(init => {
        const found = amenities.find(a => a.name === init.name && a.available);
        return {
            id: init.id,
            name: init.name,
            locked: init.locked,
            isDefault: init.isDefault,
            selected: !!found || init.locked || init.isDefault,
            type: found?.type || 'Included',
            rate: found?.rate ? String(found.rate) : '',
            rateType: found?.rateType || 'Fixed',
        };
    });
}

function mapBeverages(beverages: any[]) {
    const initialBeverages = [
        { id: 'tea', name: 'Tea', unit: 'Per Cup' },
        { id: 'coffee', name: 'Coffee', unit: 'Per Cup' },
        { id: 'water350', name: 'Water Bottle (350ml)', unit: 'Per Bottle' },
        { id: 'water500', name: 'Water Bottle (500ml)', unit: 'Per Bottle' },
        { id: 'water1l', name: 'Water Bottle (1 Ltr)', unit: 'Per Bottle' },
        { id: 'water2l', name: 'Water Bottle (2 Ltr)', unit: 'Per Bottle' },
        { id: 'dispenser', name: 'Water Dispenser (20 Ltr)', unit: 'Per Dispenser' },
        { id: 'soft350', name: 'Soft Drink (350ml)', unit: 'Per Bottle' },
        { id: 'soft750', name: 'Soft Drink (750ml)', unit: 'Per Bottle' },
        { id: 'soft1125', name: 'Soft Drink (1/1.25 Ltr)', unit: 'Per Bottle' },
        { id: 'soft2225', name: 'Soft Drink (2/2.25 Ltr)', unit: 'Per Bottle' },
    ];

    return initialBeverages.map(init => {
        const found = beverages.find(b => b.name === init.name && b.available);
        return {
            id: init.id,
            name: init.name,
            unit: init.unit,
            selected: !!found,
            ratePerUnit: found?.ratePerUnit ? String(found.ratePerUnit) : '',
            brand: found?.brand || '',
        };
    });
}

function mapRefreshmentFood(food: any[]) {
    const initialFood = [
        { id: 'snack3', name: 'Snacks Pack (3 Items)', category: 'Snack' as const },
        { id: 'bp1', name: 'Breakfast Pack (1 Item)', category: 'Breakfast' as const },
        { id: 'bp2', name: 'Breakfast Pack (2 Items)', category: 'Breakfast' as const },
        { id: 'bp3', name: 'Breakfast Pack (3 Items)', category: 'Breakfast' as const },
    ];

    return initialFood.map(init => {
        const found = food.find(f => f.name === init.name && f.available);
        return {
            id: init.id,
            name: init.name,
            category: init.category,
            selected: !!found,
            ratePerPlate: found?.ratePerPlate ? String(found.ratePerPlate) : '',
            items: found?.items || '',
        };
    });
}

function mapLunchThalis(thalis: any[]) {
    if (!Array.isArray(thalis) || thalis.length === 0) return [];

    return thalis
        .filter(t => t.available && t.categories && t.categories.length > 0)
        .map(t => {
            const cat = t.categories[0]; // Take first category
            return {
                thaliType: t.thaliType || '',
                category: cat.category || '',
                ratePerPlate: cat.ratePerPlate ? String(cat.ratePerPlate) : '',
                items: cat.itemsName || cat.itemNames || '', // Handle both field names
            };
        });
}

function mapFacility(facility: any) {
    return {
        available: facility?.available || false,
        type: facility?.type || 'Included',
        rate: facility?.charges ? String(facility.charges) : '',
    };
}

function mapAdditional(additional: any[]) {
    const initialAdditional = [
        'Separate Washrooms',
        'Power Backup',
        'Security Personnel',
        'Daily Cleaning',
        'Reception Service',
        'Storage Space',
        'Valet Parking',
        'Wheelchair Access',
        'Elevator',
    ];

    return initialAdditional.map(name => {
        const found = additional.find(a => a.name === name && a.available);
        return {
            name,
            selected: !!found,
            type: found?.type || 'Included',
            rate: found?.charges ? String(found.charges) : '',
        };
    });
}

function categoryToSectionKey(category: string): string {
    const map: Record<string, string> = {
        Featured: 'featured',
        Exterior: 'exterior',
        Interior: 'interior',
        Amenities: 'amenities',
        Additional: 'additional',
    };
    return map[category] || category.toLowerCase();
}

function buildUploadsMap(venue: any): Record<string, string> {
    const uploads: Record<string, string> = {};

    if (venue.documents?.idProof?.frontUrl) uploads.id_front = 'ID Front';
    if (venue.documents?.idProof?.backUrl) uploads.id_back = 'ID Back';
    if (venue.documents?.selfieUrl) uploads.selfie = 'Selfie';
    if (venue.documents?.businessProof?.documentUrl) uploads.biz_doc = 'Business Document';
    if (venue.ownerInfo?.hasGST && venue.ownerInfo?.gstNumber) uploads.gst_doc = 'GST Certificate';

    return uploads;
}

function buildUploadedDocs(venue: any) {
    const docs: { url: string; publicId: string; uploadKey: string }[] = [];

    if (venue.documents?.idProof?.frontUrl) {
        docs.push({
            url: venue.documents.idProof.frontUrl,
            publicId: '',
            uploadKey: 'id_front',
        });
    }
    if (venue.documents?.idProof?.backUrl) {
        docs.push({
            url: venue.documents.idProof.backUrl,
            publicId: '',
            uploadKey: 'id_back',
        });
    }
    if (venue.documents?.selfieUrl) {
        docs.push({
            url: venue.documents.selfieUrl,
            publicId: '',
            uploadKey: 'selfie',
        });
    }
    if (venue.documents?.businessProof?.documentUrl) {
        docs.push({
            url: venue.documents.businessProof.documentUrl,
            publicId: '',
            uploadKey: 'biz_doc',
        });
    }

    return docs;
}