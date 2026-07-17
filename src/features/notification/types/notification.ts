export type NotificationType =
    | 'booking_created'
    | 'booking_confirmed'
    | 'booking_completed'
    | 'booking_cancelled'
    | 'general';

export interface Notification {
    _id?: string; // optional if coming from DB

    recipient: string; // user ID as string

    type?: NotificationType;

    title: string;

    message: string;

    link?: string;

    isRead?: boolean;

    createdAt?: Date;
}