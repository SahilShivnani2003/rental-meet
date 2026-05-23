import { useMutation } from "@tanstack/react-query"
import { deleteVenue } from "../services/VenueService"

export const useDeleteVenue = () => {
    return useMutation({
        mutationFn: deleteVenue
    })
}