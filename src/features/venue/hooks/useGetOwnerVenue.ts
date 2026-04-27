import { useQuery } from "@tanstack/react-query"
import { getOwnerVenue } from "../services/OwnerVenueService"

export const useGetOwnerVenue = (options?: { enabled?: boolean }) =>{
    return useQuery({
        queryKey: ['get-ownerVenue'],
        queryFn: getOwnerVenue,
        enabled: options?.enabled,
    })
}