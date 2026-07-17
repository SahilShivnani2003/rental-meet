import { useMutation, useQuery } from "@tanstack/react-query"
import { getNotification, registerDevice } from "../services/notificationService"

export const useGetNotification = () => {
    return useQuery({
        queryKey: ['getNotification'],
        queryFn: getNotification
    })
}

export const useRegisterDevice = async() =>{
    return useMutation({
        mutationFn: registerDevice
    })
}