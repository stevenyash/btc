import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Layout } from "@/components/Layout"
import { useAuthStore } from "@/stores/useAuthStore"
import { captureReferralFromUrl, getReferralCode, setReferralCode } from "@/utils/referral"

const loginSchema = z.object({
  phone: z.string().min(1, "Phone / Email is required"),
  userCode: z.string().min(1, "User code is required"),
  referralCode: z.string().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login, isLoading, error, clearError, hasRole } = useAuthStore()

  const redirectFromQuery = searchParams.get("redirect")
  const from = redirectFromQuery || (location.state as { from?: Location })?.from?.pathname || "/dashboard"

  const getRedirectPath = () => {
    if (hasRole("admin") || hasRole("superadmin")) return "/admin"
    if (hasRole("marketer")) return "/marketer-dashboard"
    if (hasRole("subscriber") || hasRole("student")) return "/dashboard"
    return "/dashboard"
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      referralCode: getReferralCode() || "",
    },
  })

  useEffect(() => {
    const refCode = captureReferralFromUrl()
    if (refCode) {
      setValue("referralCode", refCode)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    
    if (data.referralCode) {
      setReferralCode(data.referralCode)
    }
    
    try {
      await login({ identifier: data.phone, code: data.userCode })
      const redirectTo = from !== "/dashboard" ? from : getRedirectPath()
      navigate(redirectTo, { replace: true })
    } catch (err: unknown) {
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <div className="flex justify-center pt-2 ">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="rounded-full h-20 w-auto object-contain"
            />
          </div>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue to your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone / Email</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="Enter phone or email"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="userCode">User Code</Label>
                <Input
                  id="userCode"
                  type="text"
                  placeholder="Enter your user code"
                  {...register("userCode")}
                />
                {errors.userCode && (
                  <p className="text-sm text-red-500">{errors.userCode.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="Enter referral code if you have one"
                  {...register("referralCode")}
                />
                {errors.referralCode && (
                  <p className="text-sm text-red-500">{errors.referralCode.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                <Link to="/forgot-usercode" className="hover:underline">
                  Forgot user code?
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  )
}