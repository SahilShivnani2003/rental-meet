import { useQuery } from "@tanstack/react-query"
import { getOwnerDashboard } from "../service/ownerDashboardService"

export const useGetOwnerDashboard = () =>{
    return useQuery({
        queryKey: ['get-ownerDashboard'],
        queryFn: getOwnerDashboard,
    })
}