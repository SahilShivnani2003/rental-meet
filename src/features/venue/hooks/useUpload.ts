import { useMutation } from "@tanstack/react-query"
import { uploadDocument, uploadImage } from "../services/uploadService"

export const useUploadImage = () => {
    return useMutation({
        mutationFn: uploadImage,
    })
};

export const useUploadDocument = () => {
    return useMutation({
        mutationFn: uploadDocument,
    })
}