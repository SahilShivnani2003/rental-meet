import { useMutation, useQuery } from "@tanstack/react-query"
import { createVenueCoupons, deleteVenueCoupon, getVenueCouponById, getVenueCoupons, updateVenueCoupon } from "../service/venueCouponService"

export const useGetVenueCoupons = () => {
    return useQuery({
        queryKey: ['GetVenueCoupon'],
        queryFn: getVenueCoupons
    })
}

export const useCreateVenueCoupon = () => {
    return useMutation({
        mutationFn: createVenueCoupons
    })
}

export const useGetVenueCouponById = (id: string) => {
    return useQuery({
        queryKey: ['VenueCouponById', id],
        queryFn: () => getVenueCouponById(id),
        enabled: !!id
    })
}

export const useUpdateVenueCoupon = () => {
    return useMutation({
        mutationFn: updateVenueCoupon
    })
}

export const useDeleteVenueCoupon = () => {
    return useMutation({
        mutationFn: deleteVenueCoupon
    })
}