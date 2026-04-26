import { useQuery } from "@tanstack/react-query"
import { getTermsConditions } from "../service/platformSettingService"

export const useTermsCondition = () => {
    return useQuery({
        queryKey: ['get-termsCondition'],
        queryFn: getTermsConditions,
    })
}