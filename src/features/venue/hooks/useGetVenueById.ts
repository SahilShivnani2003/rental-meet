import { useQuery } from "@tanstack/react-query"
import { getVenueById } from "../services/VenueService"

export const useGetVenueById = (id: string) => {
    return useQuery({
        queryKey: ['get-venueById'],
        queryFn: () => getVenueById(id),
        enabled: !!id,
    })
}