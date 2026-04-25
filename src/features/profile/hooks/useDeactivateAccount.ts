import { useMutation } from "@tanstack/react-query"
import { deactivateAccount } from "../service/profileService"

export const useDeactivateAccount = () => {
    return useMutation({
        mutationFn: deactivateAccount,
    })
}