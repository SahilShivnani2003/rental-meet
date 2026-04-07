import { apiClient, getAuthHeader } from "../api-client"

export const paymentAPI = {
    createPayment: (data: {
        bookingId: string,
        amount: number
    }) => apiClient.post('payment/create-order', data, {
        headers: getAuthHeader()
    }),

    verifyPayment: (data: {
        razorpay_order_id: string,
        razorpay_payment_id: string,
        razorpay_signature: any,
        bookingId: string
    }) => apiClient.post('payment/verify', data, {
        headers: getAuthHeader()
    })
}   