import { useMutation } from "@tanstack/react-query"
import { sendEmailOtp, sendPhoneOtp, verifyEmailOtp, verifyPhoneOtp } from "../service/authService"

export const useSendEmailOtp = () => {
    return useMutation({
        mutationFn: sendEmailOtp,
    })
}

export const useVerifyEmailOtp = () => {
    return useMutation({
        mutationFn: verifyEmailOtp,
    })
}

export const useSendPhoneOtp = () => {
    return useMutation({
        mutationFn: sendPhoneOtp,
    })
}

export const useVerifyPhoneOtp = () => {
    return useMutation({
        mutationFn: verifyPhoneOtp,
    })
}

