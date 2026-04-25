import { useQuery } from "@tanstack/react-query"
import { getBookingDetail } from "../service/bookingService"

export const useGetBookingDetail = (id: string) => {
    return useQuery({
        queryKey: ['get-bookingDetail'],
        queryFn: () => getBookingDetail(id),
        enabled: !!id
    })
}