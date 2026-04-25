import { useQuery } from "@tanstack/react-query"
import { getAllBookings } from "../service/bookingService"

export const useGetAllBookings = () => {
    return useQuery({
        queryKey: ['get-booking'],
        queryFn: getAllBookings,
    })
}