import { privateClient } from "@/service/apiClient";

export const createPaymentOrder = async (data: { amount: number, bookingType: string }) => {
    try {
        console.log('Creating payment order ....');

        const response = await privateClient.post('/payment/create-order', data);

        console.log('Payment order response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while creating payment order : ', error);
        throw error;
    }
};

interface RazorpayPaymentPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    bookingId: string;
    paidAmount: number;
    bookingType: string;
}
export const verifyPayment = async (data: RazorpayPaymentPayload) => {
    try {
        console.log('Verfiying payment ......');

        const response = await privateClient.post('/payment/verify', data);

        console.log('Verify payment response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while verifying payment : ', error);
        throw error;
    }
}