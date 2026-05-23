import { useQuery } from "@tanstack/react-query"
import { getVenueQuotationDownloads } from "../service/venueQuotation"

export const useGetVenueQuotations = (options?:{enabled: boolean}) =>{
    return useQuery({
        queryKey: ['get-VenueQuotation'],
        queryFn: getVenueQuotationDownloads,
        enabled: options?.enabled
    })
}