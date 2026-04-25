import { useQuery } from "@tanstack/react-query"
import { getOtherService } from "../service/otherService"

export const useGetVendorServices = () => {
    return useQuery({
        queryKey: ['get-OtherService'],
        queryFn: getOtherService,
    })
}