import { useQuery } from "@tanstack/react-query"
import { getVenueBlockedDates } from "../service/bookingService"

export const useBlockedDates = (sku: string) =>{
    return useQuery({
        queryKey: ['GetBlockedDates'],
        queryFn:()=> getVenueBlockedDates(sku)
    })
}