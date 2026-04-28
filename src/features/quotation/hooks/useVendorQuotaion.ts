import { useQuery } from "@tanstack/react-query"
import { getVendorServiceQuotations } from "../service/vendorServiceQuotations"

export const useGetVendorQuationDownloads = () =>{
    return useQuery({
        queryKey: ['get-quotationDownloads'],
        queryFn: getVendorServiceQuotations
    })
}