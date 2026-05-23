import { useMutation, useQuery } from "@tanstack/react-query"
import { createServiceBooking, getCustomerBookings, getServicePlatformSetting, updateQuotationDownloaded, vendorServiceBookings } from "../service/VendorServiceBooking"

export const useCreateServiceBooking = () => {
    return useMutation({
        mutationFn: createServiceBooking,
    })
}

export const useSendQuotationRequest = () =>{
    return useMutation({
        mutationFn: updateQuotationDownloaded
    })
}

export const useServicePlatformSetting = () =>{
    return useQuery({
        queryKey: ['get-vendorPlatformSetting'],
        queryFn: getServicePlatformSetting,
    })
}

export const useGetCustomerServicebookings = () => {
    return useQuery({
        queryKey: ['get-serviceBooking'],
        queryFn: getCustomerBookings,
    })
}

export const useGetVendorServiceBooking = () =>{
    return useQuery({
        queryKey: ['get-vendorServiceBooking'],
        queryFn: vendorServiceBookings
    })
}