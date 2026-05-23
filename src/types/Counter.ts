export interface Counter {
    _id: string;
    sequence?: number;
    year?: number;
    state?: string;
    city?: string;
    createdAt?: Date;
    updatedAt?: Date;
}