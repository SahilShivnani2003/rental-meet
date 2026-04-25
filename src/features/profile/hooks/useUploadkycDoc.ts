import { useMutation } from "@tanstack/react-query"
import { uploadKycDoc } from "../service/profileService"

export const useUploadKycDoc = () => {
    return useMutation({
        mutationFn: uploadKycDoc,
    })
}