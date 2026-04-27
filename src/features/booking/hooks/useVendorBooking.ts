import { useMutation } from "@tanstack/react-query"
import { dummyCall } from "../service/VendorServiceBooking"

export const useCreateServiceBooking = () => {
    return useMutation({
        mutationFn: dummyCall,
    })
}

export const useSendQuotationRequest = () =>{
    return useMutation({
        mutationFn: dummyCall
    })
}