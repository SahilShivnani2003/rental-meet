import { useMutation } from "@tanstack/react-query"
import { approveSoon } from "../service/bookingService"

export const useApproveBooking = () =>{
    return useMutation({
        mutationFn: approveSoon,
    })
}