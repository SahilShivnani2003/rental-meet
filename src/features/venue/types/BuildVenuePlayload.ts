import { VenueFormData } from './VenueFormData';
import { Venue } from './Venue';

export function buildVenuePayload(
    form: VenueFormData,
    includeExtendedPricing = false,
): Omit<Venue, '_id' | 'owner'> {
    const {
        basic,
        location,
        amenities,
        cateringFacility,
        pricing,
        photos,
        socialLinks,
        documents,
        terms,
    } = form;

    const basePayload: Omit<Venue, '_id' | 'owner'> = {
        businessName: basic.businessName.trim(),
        venueType: basic.venueTypes,
        description: basic.description.trim(),
        capacity: basic.capacity as Venue['capacity'],
        areaSqft: Number(basic.areaSqft) || 0,
        foodType: basic.foodType,
        rulesAndPolicies: {
            foodPolicy: terms.rulesAndPolicies.foodPolicy.trim() || undefined,
            outsideVendors: terms.rulesAndPolicies.outsideVendors.trim() || undefined,
            decoration: terms.rulesAndPolicies.decoration.trim() || undefined,
            musicNoise: terms.rulesAndPolicies.musicNoise.trim() || undefined,
            alcohol: terms.rulesAndPolicies.alcohol.trim() || undefined,
            pets: terms.rulesAndPolicies.pets.trim() || undefined,
        },
        taxSettings: {
            taxType: pricing.taxType,
            gstRate: pricing.taxType === 'GST Not Applicable' ? undefined : num(pricing.gstRate),
        },

        location: {
            address: location.address.trim(),
            landmark: location.landmark.trim(),
            state: location.state.trim(),
            city: location.city.trim(),
            village: location.village.trim() || undefined,
            area: location.area.trim(),
            pincode: location.pincode.trim(),
            googleMapLink: location.googleMapLink.trim(),
            parkingAvailability: mapParking(location.parkingAvailability),
            nearestBusAuto: location.nearestBusAuto.trim() || undefined,
            nearestMetroTrain: location.nearestMetroTrain.trim() || undefined,
        },

        amenities: {
            basic: amenities.basic
                .filter(a => a.selected)
                .map(a => ({
                    name: a.name,
                    available: true,
                    type: a.locked ? 'Included' : a.type,
                    rate: a.type === 'Paid' && a.rate ? Number(a.rate) : undefined,
                    rateType: a.type === 'Paid' ? a.rateType : undefined,
                })),
            beverages: amenities.beverages
                .filter(b => b.selected)
                .map(b => ({
                    name: b.name,
                    available: true,
                    ratePerUnit: b.ratePerUnit ? Number(b.ratePerUnit) : undefined,
                    brand: b.brand.trim() || undefined,
                })),
            refreshmentFood: amenities.refreshmentFood
                .filter(f => f.selected)
                .map(f => ({
                    name: f.name,
                    available: true,
                    ratePerPlate: f.ratePerPlate ? Number(f.ratePerPlate) : undefined,
                    items: f.items.trim() || undefined,
                })),

            // ── FIXED: map over the actual `categories` array on each thali ──
            lunchThalis: amenities.lunchThalis
                .filter(t => t.categories.length > 0)
                .map(t => ({
                    thaliType: t.thaliType as any,
                    available: true,
                    categories: t.categories.map(c => ({
                        category: c.category as any,
                        ratePerPlate: Number(c.ratePerPlate) || 0,
                        numberOfItems: Number(c.numberOfItems) || 0,
                        itemNames: c.itemNames.trim(),
                    })),
                })),

            kitchenAccess: {
                available: amenities.kitchenAccess.available,
                type: amenities.kitchenAccess.type,
                charges:
                    amenities.kitchenAccess.type === 'Paid' && amenities.kitchenAccess.rate
                        ? Number(amenities.kitchenAccess.rate)
                        : undefined,
            },

            diningArea: {
                available: amenities.diningArea.available,
                type: amenities.diningArea.type,
                charges:
                    amenities.diningArea.type === 'Paid' && amenities.diningArea.rate
                        ? Number(amenities.diningArea.rate)
                        : undefined,
            },
            additional: amenities.additional
                .filter(a => a.selected)
                .map(a => ({
                    name: a.name,
                    available: true,
                    type: a.type,
                    charges: a.type === 'Paid' && a.rate ? Number(a.rate) : undefined,
                })),
        },

        cateringFacility: {
                available: cateringFacility.available,
                outsideCateringAllowed: cateringFacility.available
                    ? cateringFacility.outsideCateringAllowed
                    : false,
                beverages: amenities.beverages
                    .filter(item => item.selected)
                    .map(item => ({
                        name: item.name,
                        available: true,
                        ratePerUnit: num(item.ratePerUnit),
                    })),
                breakfast: amenities.refreshmentFood
                    .filter(item => item.selected && item.category === 'Breakfast')
                    .map(item => ({
                        name: item.name,
                        available: true,
                        ratePerPlate: num(item.ratePerPlate),
                        items: item.items.trim() || undefined,
                    })),
                lunchDinner: amenities.lunchThalis.flatMap(thali =>
                    thali.categories.map(category => ({
                        name: `${thali.thaliType} - ${category.category}`,
                        available: true,
                        foodType: basic.foodType === 'Non Veg' ? 'Non-Veg' as const : basic.foodType,
                        ratePerPlate: num(category.ratePerPlate),
                        items: category.itemNames.trim() || undefined,
                    })),
                ),
        },

        additionalFacilities: amenities.additional
                .filter(item => item.selected)
                .map(item => ({
                    name: item.name,
                    available: true,
                    type: item.type,
                    charges: item.type === 'Paid' ? num(item.rate) : undefined,
                })),

        pricing: {
            enabledOptions: {
                perHour: pricing.enabledOptions?.perHour,
                halfDay: pricing.enabledOptions?.halfDay,
                fullDay: pricing.enabledOptions?.fullDay,
            },
            perHour: {
                weekday: num(pricing.prices.perHour?.weekday),
                weekend: num(pricing.prices.perHour?.weekend),
            },
            halfDay: {
                weekday: num(pricing.prices.halfDay?.weekday),
                weekend: num(pricing.prices.halfDay?.weekend),
            },
            fullDay: {
                weekday: num(pricing.prices.fullDay?.weekday),
                weekend: num(pricing.prices.fullDay?.weekend),
            },
            extraHourRate: {
                weekday: num(pricing.prices.extraHour?.weekday),
                weekend: num(pricing.prices.extraHour?.weekend),
            },
            ...(includeExtendedPricing
                ? {
                      selectedPricingModels: pricing.selectedPricingModels,
                      onlyRent: {
                          hourly: {
                              rate: num(pricing.onlyRent.hourly.rate),
                              extraPerHour: num(pricing.onlyRent.hourly.extraPerHour),
                          },
                          halfDay: {
                              rate: num(pricing.onlyRent.halfDay.rate),
                              extraPerHour: num(pricing.onlyRent.halfDay.extraPerHour),
                          },
                          fullDay: {
                              rate: num(pricing.onlyRent.fullDay.rate),
                              extraPerHour: num(pricing.onlyRent.fullDay.extraPerHour),
                          },
                      },
                      rentWithAmenities: {
                          hourly: {
                              rate: num(pricing.rentWithAmenities.hourly.rate),
                              extraPerHour: num(pricing.rentWithAmenities.hourly.extraPerHour),
                          },
                          halfDay: {
                              rate: num(pricing.rentWithAmenities.halfDay.rate),
                              extraPerHour: num(pricing.rentWithAmenities.halfDay.extraPerHour),
                          },
                          fullDay: {
                              rate: num(pricing.rentWithAmenities.fullDay.rate),
                              extraPerHour: num(pricing.rentWithAmenities.fullDay.extraPerHour),
                          },
                      },
                      perPax: {
                          withoutFood: {
                              rate: num(pricing.perPax.withoutFood.rate),
                              minPax: num(pricing.perPax.withoutFood.minPax),
                          },
                          breakfastOnly: {
                              rate: num(pricing.perPax.breakfastOnly.rate),
                              minPax: num(pricing.perPax.breakfastOnly.minPax),
                          },
                          breakfastLunch: {
                              rate: num(pricing.perPax.breakfastLunch.rate),
                              minPax: num(pricing.perPax.breakfastLunch.minPax),
                          },
                          lunchOnly: {
                              rate: num(pricing.perPax.lunchOnly.rate),
                              minPax: num(pricing.perPax.lunchOnly.minPax),
                          },
                          dinnerOnly: {
                              rate: num(pricing.perPax.dinnerOnly.rate),
                              minPax: num(pricing.perPax.dinnerOnly.minPax),
                          },
                          allMeals: {
                              rate: num(pricing.perPax.allMeals.rate),
                              minPax: num(pricing.perPax.allMeals.minPax),
                          },
                      },
                  }
                : {}),
        },

        availability: {
            openingTime: pricing.openTime,
            closingTime: pricing.closeTime,
            availableDays: pricing.availDays as any[],
            advanceBookingRule: pricing.advanceBooking !== 'Select option'
                ? (pricing.advanceBooking as any)
                : undefined,
            blackoutDates: pricing.blackoutDate
                ? [{ date: new Date(pricing.blackoutDate) }]
                : [],
            confirmationHours: pricing.confirmationHours,
        },

        socialLinks: {
            instagram: socialLinks.instagram.trim() || undefined,
            facebook: socialLinks.facebook.trim() || undefined,
            youtube: socialLinks.youtube
                .split(/[\n,]+/)
                .map(link => link.trim())
                .filter(Boolean),
            website: socialLinks.website.trim() || undefined,
        },

        images: photos.uploadedImages.map(img => ({
            url: img.url,
            category: sectionKeyToCategory(img.sectionKey),
            isFeatured: img.sectionKey === 'featured',
            uploadedAt: new Date(),
        })),

        ownerInfo: {
            fullName: documents.fullName.trim(),
            email: documents.email.trim(),
            mobile: documents.mobile.trim(),
            alternatePhone: documents.altMobile.trim() || undefined,
            role: documents.role as any,
            hasGST: documents.hasGST,
            gstNumber: documents.hasGST ? documents.gstNumber.trim() : undefined,
        },

        documents: {
            idProof: {
                type: documents.idType === 'aadhaar' ? 'Aadhaar' : 'PAN',
                number: documents.idNumber.trim(),
                frontUrl: documents.uploadedDocs.find(d => d.uploadKey === 'id_front')?.url,
                backUrl: documents.uploadedDocs.find(d => d.uploadKey === 'id_back')?.url,
            },
            selfieUrl: documents.uploadedDocs.find(d => d.uploadKey === 'selfie')?.url,
            businessProof: {
                type: documents.bizProofType as any,
                documentUrl: documents.uploadedDocs.find(d => d.uploadKey === 'biz_doc')?.url,
                otherSpecify: documents.bizProofOther,
            },
            verified: false,
        },

        bankDetails: {
            accountHolderName: documents.accountHolder.trim(),
            accountNumber: documents.accountNumber.trim(),
            ifscCode: documents.ifsc.trim().toUpperCase(),
            bankName: documents.bankName.trim(),
            branchName: documents.branchName.trim(),
            accountType: documents.accountType as any,
            bankProofUrl: documents.bankProofUrl,
            bankProofPublicId: documents.bankProofPublicId,
        },

        termsAccepted: terms.agreed,
        termsAcceptedDate: terms.agreed ? new Date() : undefined,
    };

    return basePayload;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function num(val: string | undefined): number | undefined {
    const n = Number(val);
    return isNaN(n) || !val ? undefined : n;
}

function mapParking(raw: string): 'Free' | 'Paid' | 'Limited' | 'None' {
    if (raw === 'No') return 'None';
    if (['Free', 'Paid', 'Limited'].includes(raw)) return raw as any;
    return 'None';
}

function sectionKeyToCategory(
    key: string,
): 'Featured' | 'Exterior' | 'Interior' | 'Amenities' | 'Additional' {
    const map: Record<string, 'Featured' | 'Exterior' | 'Interior' | 'Amenities' | 'Additional'> =
    {
        featured: 'Featured',
        exterior: 'Exterior',
        interior: 'Interior',
        amenities: 'Amenities',
        additional: 'Additional',
    };
    return map[key] ?? 'Additional';
}