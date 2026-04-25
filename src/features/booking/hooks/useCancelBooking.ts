import { useMutation } from "@tanstack/react-query"
import { cancleBooking } from "../service/bookingService"

export const useCancelBooking = () => {
    return useMutation({
        mutationFn: cancleBooking,
    })
}