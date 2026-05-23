import { useMutation } from "@tanstack/react-query"
import { createBooking } from "../service/bookingService"

export const useCreateBooking = () => {
    return useMutation({
        mutationFn: createBooking,
    })
}