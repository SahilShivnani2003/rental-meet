import { useMutation } from "@tanstack/react-query"
import { modifyBooking } from "../service/bookingService"

export const useModifyingBooking = () => {
    return useMutation({
        mutationFn: modifyBooking,
    })
}