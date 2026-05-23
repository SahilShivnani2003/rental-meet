export interface VenueType {
    _id?: string;

    name: string;
    code: string;
    description?: string;
    icon?: string;

    isActive?: boolean;
    order?: number;

    createdAt?: Date;
    updatedAt?: Date;
}