import { useMutation } from "@tanstack/react-query"
import { updateVenue } from "../services/VenueService"

export const useUpdateVenue = () => {
    return useMutation({
        mutationFn: updateVenue,
    })
}