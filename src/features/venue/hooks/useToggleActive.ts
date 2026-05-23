import { useMutation } from "@tanstack/react-query"
import { toggleVenueActive } from "../services/OwnerVenueService"

export const useToggleActive = () =>{
    return useMutation({
        mutationFn: toggleVenueActive
    })
}