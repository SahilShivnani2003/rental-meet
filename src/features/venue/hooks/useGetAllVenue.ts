import { useQuery } from "@tanstack/react-query"
import { getAllVenues } from "../services/VenueService"

export const useGetAllVenue = () => {
    return useQuery({
        queryKey: ['get-venue'],
        queryFn: getAllVenues
    })
}