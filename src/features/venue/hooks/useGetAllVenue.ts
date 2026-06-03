import { useInfiniteQuery } from "@tanstack/react-query";
import { getAllVenues, VenueParams } from "../services/VenueService";

const PAGE_SIZE = 10;

type FilterParams = Omit<VenueParams, 'page' | 'limit'>;

export const useGetAllVenue = (
    params?: FilterParams,
    options?: { enabled?: boolean }
) => {
    return useInfiniteQuery({
        queryKey: ['get-venue', params],
        queryFn: ({ pageParam }) =>
            getAllVenues({
                ...params,
                page: String(pageParam),
                limit: String(PAGE_SIZE),
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const total: number = lastPage?.total ?? lastPage?.totalCount ?? 0;
            const fetched = allPages.flatMap(p => p.venues ?? []).length;
            return fetched < total ? allPages.length + 1 : undefined;
        },
        enabled: options?.enabled,
    });
};