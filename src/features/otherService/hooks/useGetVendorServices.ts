import { useInfiniteQuery } from "@tanstack/react-query";
import { getOtherService, OtherServiceParams } from "../service/otherService";

const PAGE_SIZE = 10;

type FilterParams = Omit<OtherServiceParams, 'page' | 'limit'>;

export const useGetVendorServices = (params?: FilterParams) => {
    return useInfiniteQuery({
        queryKey: ['get-OtherService', params],
        queryFn: ({ pageParam }) =>
            getOtherService({
                ...params,
                page: String(pageParam),
                limit: String(PAGE_SIZE),
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const total: number = lastPage?.total ?? lastPage?.totalCount ?? 0;
            const fetched = allPages.flatMap(p => p.services ?? []).length;
            return fetched < total ? allPages.length + 1 : undefined;
        },
    });
};