import { useMutation } from "@tanstack/react-query"
import { registerAmbassador, registerUser } from "../service/authService"

export const useRegister = () => {
    return useMutation({
        mutationFn: registerUser,
    })
}

export const useAmbassadorApply = () => {
    return useMutation({
        mutationFn: registerAmbassador,
    })
}