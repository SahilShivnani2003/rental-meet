import { useQuery } from "@tanstack/react-query"
import { getVenueLocations } from "../services/VenueService"

export const useGetVenueLoc = () =>{
    return useQuery({
        queryKey: ['get-venueLoc'],
        queryFn: getVenueLocations
    })
}