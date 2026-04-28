import { useQuery } from "@tanstack/react-query"
import { getVendorProfile } from "../service/vendorService"

export const useGetVendorProfile = (options?: { enabled: boolean }) => {
    return useQuery({
        queryKey: ['get-vendorProfile'],
        queryFn: getVendorProfile,
        enabled: options?.enabled,
    })
}