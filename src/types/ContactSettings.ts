export interface ContactSettings {
    address: string;
    address2?: string;

    phone: string;
    phone2?: string;

    email: string;
    email2?: string;

    availability?: string;

    socialMedia?: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
        youtube?: string;
        whatsapp?: string;
    };

    filterSettings?: {
        capacityMin?: number;
        capacityMax?: number;
        priceMin?: number;
        priceMax?: number;
    };

    createdAt?: Date;
    updatedAt?: Date;
}