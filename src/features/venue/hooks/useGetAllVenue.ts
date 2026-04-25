import { useQuery } from "@tanstack/react-query"
import { getAllVenues, VenueParams } from "../services/VenueService"

export const useGetAllVenue = (params?: VenueParams) => {
  return useQuery({
    queryKey: ['get-venue', params],
    queryFn: () => getAllVenues(params)
  })
}