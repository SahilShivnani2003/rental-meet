import { useQuery } from "@tanstack/react-query"
import { getVendorServiceQuotations } from "../service/vendorServiceQuotations"

export const useGetVendorQuationDownloads = (options?:{enabled:boolean}) =>{
    return useQuery({
        queryKey: ['get-quotationDownloads'],
        queryFn: getVendorServiceQuotations,
        enabled: options?.enabled
    })
}