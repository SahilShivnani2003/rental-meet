import { useMutation } from "@tanstack/react-query"
import { createVenue } from "../services/VenueService"

export const useCreateVenue = () => {
    return useMutation({
        mutationFn: createVenue
    })
}