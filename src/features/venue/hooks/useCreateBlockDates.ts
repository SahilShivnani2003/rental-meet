import { useMutation } from "@tanstack/react-query"
import { createBlockedDates } from "../services/OwnerVenueService"

export const useCreateBlockDates = () =>{
    return useMutation({
        mutationFn: createBlockedDates
    })
}