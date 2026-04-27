import { useQuery } from "@tanstack/react-query"
import { getVendorProfile } from "../service/vendorService"

export const useGetVendorProfile = () => {
    return useQuery({
        queryKey: ['get-vendorProfile'],
        queryFn: getVendorProfile,
    })
}