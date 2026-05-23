import { useMutation } from "@tanstack/react-query"
import { deleteAccount } from "../service/profileService"

export const useDeleteAccount = () => {
    return useMutation({
        mutationFn: deleteAccount,
    })
}