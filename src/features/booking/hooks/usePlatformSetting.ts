import { useQuery } from "@tanstack/react-query"
import { getVenuePlatformSettings } from "../service/platformSettingService"

export const usePlatformSetting = () =>{
    return useQuery({
        queryKey: ['get-platformSetting'],
        queryFn: getVenuePlatformSettings,
    })
}