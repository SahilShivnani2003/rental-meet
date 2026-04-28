import { useMutation } from "@tanstack/react-query"
import { resubmitVenue } from "../services/OwnerVenueService"

export const useResubmitVenue = () => {
    return useMutation({
        mutationFn: resubmitVenue
    })
}