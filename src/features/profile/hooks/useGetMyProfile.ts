import { useQuery } from "@tanstack/react-query"
import { getMyProfile } from "../service/profileService"

export const useGetMyProfile = () => {
    return useQuery({
        queryKey: ['get-myProfile'],
        queryFn: getMyProfile,
    })
}