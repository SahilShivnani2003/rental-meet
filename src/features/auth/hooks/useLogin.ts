import { useMutation } from "@tanstack/react-query"
import { login } from "../service/authService"

export const useLogin = () =>{
    return useMutation({
        mutationFn: login,
    })
}