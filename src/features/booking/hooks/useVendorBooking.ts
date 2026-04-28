import { useMutation, useQuery } from "@tanstack/react-query"
import { createServiceBooking, getServicePlatformSetting, updateQuotationDownloaded } from "../service/VendorServiceBooking"

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