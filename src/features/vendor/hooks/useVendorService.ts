import { useMutation, useQuery } from "@tanstack/react-query"
import { createVendorService, getVendorProfile, getVendorServices, updateVendorProfile } from "../service/vendorService"

export const useGetVendorProfile = (options?: { enabled: boolean }) => {
    return useQuery({
        queryKey: ['get-vendorProfile'],
        queryFn: getVendorProfile,
        enabled: options?.enabled,
    })
}

export const useGetVendorServices = () => {
    return useQuery({
        queryKey: ['get-vendorService'],
        queryFn: getVendorServices,
    })
}

export const useCreateVendorService = () =>{
    return useMutation({
        mutationFn: createVendorService,
    })
}

export const useUpdateVendorService = () =>{
    return useMutation({
        mutationFn: updateVendorProfile
    })
}