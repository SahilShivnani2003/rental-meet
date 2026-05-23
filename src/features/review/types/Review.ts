export interface Review {
    _id?: string;

    name: string;
    role: string;

    profileImage?: string | null;

    rating: number;

    description: string;

    isActive?: boolean;
    order?: number;

    createdAt?: Date;
    updatedAt?: Date;
}