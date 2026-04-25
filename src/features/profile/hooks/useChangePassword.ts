import { useMutation } from "@tanstack/react-query"
import { changePassword } from "../service/profileService"

export const useChangePassword = () => {
    return useMutation({
        mutationFn: changePassword
    })
}