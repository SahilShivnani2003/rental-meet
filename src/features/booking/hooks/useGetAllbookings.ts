import { useQuery } from "@tanstack/react-query"
import { getAllBookings } from "../service/bookingService"

export const useGetAllBookings = (options: {enabled: boolean}) => {
    return useQuery({
        queryKey: ['get-booking'],
        queryFn: getAllBookings,
        enabled: options.enabled
    })
}