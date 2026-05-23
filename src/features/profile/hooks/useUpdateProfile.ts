import { useMutation } from "@tanstack/react-query"
import { updateProfile } from "../service/profileService"

export const useUpdateProfile = () => {
    return useMutation({
        mutationFn: updateProfile,
    })
}