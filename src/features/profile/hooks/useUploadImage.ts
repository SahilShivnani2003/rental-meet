import { upload } from "@/service/apis/uploadService"
import { useMutation } from "@tanstack/react-query"

export const useUploadImage = () =>{
    return useMutation({
        mutationFn: upload
    })
}