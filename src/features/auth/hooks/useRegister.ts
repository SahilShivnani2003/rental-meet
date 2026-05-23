import { useMutation } from "@tanstack/react-query"
import { registerUser } from "../service/authService"

export const useRegister = () =>{
    return useMutation({
        mutationFn: registerUser,
    })
}