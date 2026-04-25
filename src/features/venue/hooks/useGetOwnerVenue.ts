import { useQuery } from "@tanstack/react-query"
import { getOwnerVenue } from "../services/OwnerVenueService"

export const useGetOwnerVenue = () =>{
    return useQuery({
        queryKey: ['get-ownerVenue'],
        queryFn: getOwnerVenue
    })
}