import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    getLeaderboard,
    getAmbassadorDashboard,
    getAmbassadorVenues,
    getAmbassadorBookings,
    getAmbassadorEarnings,
    createAmbassadorPayout,
    getAmbassadorPayouts,
    requestAmbassadorPayouts,
    getAmbassadorProfile,
    updateAmbassadorProfile,
} from '../services/ambassadorService';

import { CreateAmbassadorPayout } from '../types/AmbassadorPayout';

/**
 * Get Ambassador Leaderboard
 */
export const useGetLeaderboard = () => {
    return useQuery({
        queryKey: ['getAmbassadorLeaderboard'],
        queryFn: getLeaderboard,
    });
};

/**
 * Get Ambassador Dashboard
 */
export const useGetAmbassadorDashboard = () => {
    return useQuery({
        queryKey: ['getAmbassadorDashboard'],
        queryFn: getAmbassadorDashboard,
    });
};

/**
 * Get Ambassador Venues
 */
export const useGetAmbassadorVenues = () => {
    return useQuery({
        queryKey: ['getAmbassadorVenues'],
        queryFn: getAmbassadorVenues,
    });
};

/**
 * Get Ambassador Bookings
 */
export const useGetAmbassadorBookings = () => {
    return useQuery({
        queryKey: ['getAmbassadorBookings'],
        queryFn: getAmbassadorBookings,
    });
};

/**
 * Get Ambassador Earnings
 */
export const useGetAmbassadorEarnings = () => {
    return useQuery({
        queryKey: ['getAmbassadorEarnings'],
        queryFn: getAmbassadorEarnings,
    });
};

/**
 * Create Ambassador Payout
 */
export const useCreateAmbassadorPayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAmbassadorPayout) =>
            createAmbassadorPayout(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['getAmbassadorPayouts'],
            });

            queryClient.invalidateQueries({
                queryKey: ['getAmbassadorDashboard'],
            });

            queryClient.invalidateQueries({
                queryKey: ['getAmbassadorEarnings'],
            });
        },
    });
};

/**
 * Get Ambassador Payouts
 */
export const useGetAmbassadorPayouts = () => {
    return useQuery({
        queryKey: ['getAmbassadorPayouts'],
        queryFn: getAmbassadorPayouts,
    });
};

/**
 * Request Ambassador Payout
 */
export const useRequestAmbassadorPayouts = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAmbassadorPayout) =>
            requestAmbassadorPayouts(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['getAmbassadorPayouts'],
            });

            queryClient.invalidateQueries({
                queryKey: ['getAmbassadorDashboard'],
            });

            queryClient.invalidateQueries({
                queryKey: ['getAmbassadorEarnings'],
            });
        },
    });
};

/**
 * Get Ambassador Profile
 */
export const useGetAmbassadorProfile = () => {
    return useQuery({
        queryKey: ['getAmbassadorProfile'],
        queryFn: getAmbassadorProfile,
    });
};

/**
 * Update Ambassador Profile
 */
export const useUpdateAmbassadorProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateAmbassadorProfile,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['getAmbassadorProfile'],
            });

            queryClient.invalidateQueries({
                queryKey: ['getAmbassadorDashboard'],
            });
        },
    });
};