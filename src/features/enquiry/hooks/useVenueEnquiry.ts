import { useQuery } from "@tanstack/react-query"
import { getEnquiry } from "../service/venueEnquiryService"

export const useGetEnquiry = () => {
    return useQuery({
        queryKey: ['owner-enquiry'],
        queryFn: () => getEnquiry(),
    })
}