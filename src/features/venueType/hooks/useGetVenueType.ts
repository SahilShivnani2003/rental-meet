import { useQuery } from "@tanstack/react-query"
import { getAllVenueType } from "../service/venueTypeService"

export const useGetVenueType = () => {
    return useQuery({
        queryKey: ['get-venueType'],
        queryFn: getAllVenueType,
    })
}