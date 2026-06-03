import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { BookingParasms, getAllBookings } from "../service/bookingService"

const PAGE_SIZE = 10;

type FilterParams = Omit<BookingParasms, 'page' | 'limit'>;


export const useGetAllBookings = (options: { enabled: boolean }, params: FilterParams) => {
    return useInfiniteQuery({
        queryKey: ['get-booking', params],
        queryFn: ({ pageParam }) => getAllBookings({ ...params, page: pageParam, limit: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const total: number = lastPage?.total ?? lastPage?.totalCount ?? 0;
            const fetched = allPages.flatMap(p => p.bookings ?? []).length;
            return fetched < total ? allPages.length + 1 : undefined;
        },
        enabled: options.enabled
    })
}