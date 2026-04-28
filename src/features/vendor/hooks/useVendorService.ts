import { useMutation, useQuery } from "@tanstack/react-query"
import { blockedDates, createVendorService, deleteVendorService, getVendorProfile, getVendorServiceById, getVendorServices, resSumbmitVendorService, submitVendorService, toggleVendorServiceActive, updateVendorProfile } from "../service/vendorService"
import { createBlockedDates, resubmitVenue } from "@/features/venue/services/OwnerVenueService"

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

export const useCreateVendorService = () => {
    return useMutation({
        mutationFn: createVendorService,
    })
}

export const useUpdateVendorService = () => {
    return useMutation({
        mutationFn: updateVendorProfile
    })
}

export const useGetVendorServiceById = (id: string) => {
    return useQuery({
        queryKey: ['get-vendorServiceById'],
        queryFn: () => getVendorServiceById(id),
        enabled: !!id
    })
}

export const useDeletVendorService = () =>{
    return useMutation({
        mutationFn: deleteVendorService
    })
}

export const useSubmitVendorService = () =>{
    return useMutation({
        mutationFn: submitVendorService,
    })
}

export const useResubmitVendorService  = () =>{
    return useMutation({
        mutationFn: resSumbmitVendorService
    })
}

export const useToggleActiveService = () =>{
    return useMutation({
        mutationFn: toggleVendorServiceActive,
    })
}

export const useCreateBlockDates = () =>{
    return useMutation({
        mutationFn: blockedDates
    })
}