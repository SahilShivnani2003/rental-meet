import { privateClient } from '@/service/apiClient';
import { useState, useEffect, useCallback } from 'react';

// ─── Types (mirrors the /owner/payments API response) ─────────────────────────
export interface RawPriceBreakdown {
    basePrice: number;
    amenitiesTotal: number;
    subtotal: number;
    venueCGST: number;
    venueCGSTRate: number;
    venueSGST: number;
    venueSGSTRate: number;
    gst: number;
    gstRate: number;
    platformFee: number;
    platformFeeRate: number;
    platformFeeCGST: number;
    platformFeeCGSTRate: number;
    platformFeeSGST: number;
    platformFeeSGSTRate: number;
    platformFeeGST: number;
    platformFeeTotal: number;
    discount: number;
    couponCode: string | null;
    total: number;
}

export interface RawTransaction {
    txnId: string;
    type: 'payment' | 'refund' | 'adjustment' | 'manual_payment' | 'manual_refund';
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    note?: string;
    performedBy?: string;
    date: string;
    _id?: string;
}

export interface RawBooking {
    _id: string;
    bookingNumber: string;
    priceBreakdown: RawPriceBreakdown;
    coupon?: { isOwnerSponsored?: boolean };
    customerDetails: {
        name: string;
        email?: string;
        phone?: string;
        eventType?: string;
        guestCount?: number;
        specialRequirements?: string;
    };
    paymentDetails?: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        paidAt?: string;
    };
    paymentLedger?: {
        totalDue: number;
        totalPaid: number;
        amountDue: number;
        refundDue: number;
        transactions: RawTransaction[];
        adjustments: unknown[];
    };
    venue: {
        _id: string;
        businessName: string;
        sku?: string;
        location?: {
            address?: string;
            city?: string;
            state?: string;
        };
    };
    customer?: { _id: string; name: string; email?: string; phone?: string };
    bookingDate: string;
    amount: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    createdAt: string;
}

export interface PaymentsResponse {
    success: boolean;
    bookings: RawBooking[];
    total: number;
    totalPages: number;
    stats: {
        totalRevenue: number;
        totalRefunded: number;
        paid: number;
        pending: number;
        refunded: number;
    };
    venues: { _id: string; businessName: string }[];
}
const MOCK_RESPONSE: PaymentsResponse = {
    success: true,
    bookings: [
        {
            priceBreakdown: {
                basePrice: 600,
                amenitiesTotal: 0,
                subtotal: 600,
                venueCGST: 54,
                venueCGSTRate: 9,
                venueSGST: 54,
                venueSGSTRate: 9,
                gst: 108,
                gstRate: 18,
                platformFee: 72,
                platformFeeRate: 12,
                platformFeeCGST: 6.48,
                platformFeeCGSTRate: 9,
                platformFeeSGST: 6.48,
                platformFeeSGSTRate: 9,
                platformFeeGST: 12.96,
                platformFeeTotal: 84.96,
                discount: 0,
                couponCode: null,
                total: 792.96,
            },
            coupon: { isOwnerSponsored: false },
            customerDetails: {
                name: 'Mika',
                email: 'mika@gmail.com',
                phone: '7389179043',
                eventType: '',
                guestCount: 20,
                specialRequirements: '',
            },
            paymentDetails: {
                razorpay_order_id: 'order_Su3wvK2Sgd0Css',
                razorpay_payment_id: 'pay_Su3xDcUmItcjSe',
                razorpay_signature: '58e08183cf7b92e5cd6348de8c85849896fdce2035f87e0ee4c4fc82f3fe18da',
                paidAt: '2026-05-26T16:43:43.570Z',
            },
            paymentLedger: {
                totalDue: 792.96,
                totalPaid: 792.96,
                amountDue: 0,
                refundDue: 0,
                transactions: [
                    {
                        txnId: 'BOOKING-1779813780230',
                        type: 'payment',
                        amount: 792.96,
                        status: 'pending',
                        note: 'Booking created — ₹792.96 due',
                        date: '2026-05-26T16:43:00.230Z',
                        _id: '6a15cd948538f70364756bd9',
                    },
                    {
                        txnId: 'pay_Su3xDcUmItcjSe',
                        type: 'payment',
                        amount: 792.96,
                        status: 'completed',
                        note: 'Razorpay payment — Order: order_Su3wvK2Sgd0Css',
                        date: '2026-05-26T16:43:43.569Z',
                        _id: '6a15cdbf8538f70364756bec',
                    },
                ],
                adjustments: [],
            },
            _id: '6a15cd948538f70364756bd1',
            bookingNumber: 'MPBPL26VN000002',
            venue: {
                _id: '69f31fac4fcdf8abb1578ef4',
                businessName: 'Bhopal Meeting Hall',
                sku: 'bhopal-meeting-hall-bhopal',
                location: { address: 'Bhopal', city: 'Bhopal', state: 'Madhya Pradesh' },
            },
            customer: {
                _id: '6a15c63d8538f70364756488',
                name: 'Mika',
                email: 'mika@gmail.com',
                phone: '7389179043',
            },
            bookingDate: '2026-05-29T00:00:00.000Z',
            amount: 792.96,
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: '2026-05-26T16:43:00.240Z',
        },
        {
            priceBreakdown: {
                basePrice: 700,
                amenitiesTotal: 5500,
                subtotal: 6200,
                venueCGST: 558,
                venueCGSTRate: 9,
                venueSGST: 558,
                venueSGSTRate: 9,
                gst: 1116,
                gstRate: 18,
                platformFee: 310,
                platformFeeRate: 5,
                platformFeeCGST: 27.9,
                platformFeeCGSTRate: 9,
                platformFeeSGST: 27.9,
                platformFeeSGSTRate: 9,
                platformFeeGST: 55.8,
                platformFeeTotal: 365.8,
                discount: 0,
                couponCode: null,
                total: 7681.8,
            },
            coupon: { isOwnerSponsored: false },
            customerDetails: {
                name: 'Mika',
                email: 'mika@gmail.com',
                phone: '7389179043',
                eventType: '',
                guestCount: 30,
                specialRequirements: '',
            },
            paymentDetails: {
                razorpay_order_id: 'order_Su3Ybc6fp41bii',
                razorpay_payment_id: 'pay_Su3YwMD6tmxP9H',
                razorpay_signature: '1dd1912f8d3d184699a0d9133b52f664d7c2609677efe27efabc5a3eaa86fda3',
                paidAt: '2026-05-26T16:20:39.321Z',
            },
            paymentLedger: {
                totalDue: 7681.8,
                totalPaid: 0,
                amountDue: 7681.8,
                refundDue: 0,
                transactions: [
                    {
                        txnId: 'BOOKING-1779812398970',
                        type: 'payment',
                        amount: 7681.8,
                        status: 'pending',
                        note: 'Booking created — ₹7,681.8 due',
                        date: '2026-05-26T16:19:58.974Z',
                        _id: '6a15c82e8538f7036475660a',
                    },
                    {
                        txnId: 'pay_Su3YwMD6tmxP9H',
                        type: 'payment',
                        amount: 7681.8,
                        status: 'completed',
                        note: 'Razorpay payment — Order: order_Su3Ybc6fp41bii',
                        date: '2026-05-26T16:20:39.319Z',
                        _id: '6a15c8578538f70364756621',
                    },
                    {
                        txnId: 'rfnd_Su3sPRCmyblNN9',
                        type: 'refund',
                        amount: 7681.8,
                        status: 'completed',
                        note: 'Full refund (cancelled 48+ hours before booking)',
                        performedBy: '6a15c63d8538f70364756488',
                        date: '2026-05-26T16:38:45.286Z',
                        _id: '6a15cc958538f7036475689b',
                    },
                ],
                adjustments: [],
            },
            _id: '6a15c82e8538f703647565ff',
            bookingNumber: 'MPBPL26VN000001',
            venue: {
                _id: '69f31fac4fcdf8abb1578ef4',
                businessName: 'Bhopal Meeting Hall',
                sku: 'bhopal-meeting-hall-bhopal',
                location: { address: 'Bhopal', city: 'Bhopal', state: 'Madhya Pradesh' },
            },
            customer: {
                _id: '6a15c63d8538f70364756488',
                name: 'Mika',
                email: 'mika@gmail.com',
                phone: '7389179043',
            },
            bookingDate: '2026-05-30T00:00:00.000Z',
            amount: 7681.8,
            status: 'cancelled',
            paymentStatus: 'refunded',
            createdAt: '2026-05-26T16:19:58.986Z',
        },
    ],
    total: 2,
    totalPages: 1,
    stats: {
        totalRevenue: 792.96,
        totalRefunded: 7681.8,
        paid: 1,
        pending: 0,
        refunded: 1,
    },
    venues: [{ _id: '69f31fac4fcdf8abb1578ef4', businessName: 'Bhopal Meeting Hall' }],
};

interface UseGetVenuePaymentsOptions {
    enabled?: boolean;
}

export function useGetVenuePayments({ enabled = true }: UseGetVenuePaymentsOptions = {}) {
    const [data, setData] = useState<PaymentsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const load = useCallback(
        async (isRefetch = false) => {
            if (!enabled) return;
            isRefetch ? setIsRefetching(true) : setIsLoading(true);
            try {
                
                const response = await privateClient.get('owner/payments', {})
                setData(MOCK_RESPONSE);
                setError(null);
            } catch (e) {
                setError(e as Error);
            } finally {
                setIsLoading(false);
                setIsRefetching(false);
            }
        },
        [enabled],
    );

    useEffect(() => {
        load();
    }, [load]);

    const refetch = useCallback(() => load(true), [load]);

    return { data, isLoading, isRefetching, error, refetch };
}