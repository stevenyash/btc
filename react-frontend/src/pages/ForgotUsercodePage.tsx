import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { authService } from "@/services/auth"

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotFormData = z.infer<typeof forgotSchema>

const resetSchema = z.object({
  usercode: z.string().min(6, "Usercode must be at least 6 characters"),
  confirmusercode: z.string().min(6, "Please confirm your usercode"),
}).refine((data) => data.usercode === data.confirmusercode, {
  message: "Usercodes do not match",
  path: ["confirmusercode"],
})

type ResetFormData = z.infer<typeof resetSchema>

export default function ForgotUsercodePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [step, setStep] = useState<"email" | "sent" | "reset">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetToken, _setResetToken] = useState<string>("")

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onEmailSubmit = async (data: ForgotFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await authService.forgotusercode(data.email)
      setStep("sent")
      // In real implementation, we'd also show a success message
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onResetSubmit = async (data: ResetFormData) => {
    if (!resetToken) {
      setError("Invalid or missing reset token")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await authService.resetusercode(resetToken, data.usercode, data.confirmusercode)
      navigate("/login?reset=success")
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset usercode. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // If user arrives with token directly, show reset form
  if (token) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Reset Your Usercode</CardTitle>
              <CardDescription>
                Enter your new usercode below
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetSubmit(onResetSubmit)}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="usercode">New Usercode</Label>
                  <Input
                    id="usercode"
                    type="text"
                    placeholder="Enter new usercode"
                    {...registerReset("usercode")}
                  />
                  {resetErrors.usercode && (
                    <p className="text-sm text-red-500">{resetErrors.usercode.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmusercode">Confirm Usercode</Label>
                  <Input
                    id="confirmusercode"
                    type="text"
                    placeholder="Confirm new usercode"
                    {...registerReset("confirmusercode")}
                  />
                  {resetErrors.confirmusercode && (
                    <p className="text-sm text-red-500">{resetErrors.confirmusercode.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Usercode"}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Remember your usercode?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          {step === "email" && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-2">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Forgot Usercode?</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your usercode.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit(onEmailSubmit)}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...registerEmail("email")}
                    />
                    {emailErrors.email && (
                      <p className="text-sm text-red-500">{emailErrors.email.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Remember your usercode?{" "}
                    <Link to="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </>
          )}

          {step === "sent" && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-green-600">Check Your Email</CardTitle>
                <CardDescription>
                  We've sent password reset instructions to your email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                  <p className="mb-2"><strong>What to do next:</strong></p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the reset link in the email</li>
                    <li>Enter your new usercode</li>
                    <li>Return here to sign in with your new usercode</li>
                  </ol>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep("email")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Try another email
                </Button>
                <Link to="/login" className="text-sm text-primary text-center hover:underline">
                  Back to login
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </Layout>
  )
}
