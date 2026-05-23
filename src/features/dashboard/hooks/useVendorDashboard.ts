import { getVendorStats } from "@/features/vendor/service/vendorService"
import { useQuery } from "@tanstack/react-query"

export const useVendorStats = () =>{
    return useQuery({
        queryKey:['get-vendorStats'],
        queryFn:getVendorStats
    })
}