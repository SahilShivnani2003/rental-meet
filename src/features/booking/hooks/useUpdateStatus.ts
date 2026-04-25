import { useMutation } from "@tanstack/react-query"
import { updateStatus } from "../service/bookingService"

export const useUpdateStatus = () => {
    return useMutation({
        mutationFn: updateStatus,
    })
}