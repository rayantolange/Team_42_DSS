import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation, type Location } from "react-router-dom";
import { login } from "@services/index";
import { useAuthStore } from "@store/authStore";
import { useToast } from "@components/ui/Toast";

export function useLogin() {
  const storeLogin = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      storeLogin(response.user, response.accessToken);
      showToast({
        title: `Welcome back, ${response.user.name.split(" ")[0]}`,
        description: "You're signed in to Nirnaya.",
        variant: "success",
      });
      const defaultRoute =
        response.user.role === "admin" ? "/admin/users" : "/dashboard";
      const redirectTo =
        (location.state as { from?: Location } | null)?.from?.pathname ??
        defaultRoute;
      navigate(redirectTo, { replace: true });
    },
  });
}
