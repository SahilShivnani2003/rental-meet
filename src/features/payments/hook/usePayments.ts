import { useQuery } from "@tanstack/react-query"
import { getPaymenst } from "../service/payment.service"

export const useGetVenuePayment = (params: {page: number, limit: number}) =>{
    return useQuery({
        queryKey: ['getVenuePayments'],
        queryFn: () => getPaymenst(params)
    })
}