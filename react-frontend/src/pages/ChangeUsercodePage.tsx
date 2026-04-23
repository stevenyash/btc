import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CreditCard, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { useAuthStore } from "@/stores/useAuthStore"

const changeUsercodeSchema = z.object({
  currentUsercode: z.string().min(1, "Current usercode is required"),
  newUsercode: z.string().min(6, "New usercode must be at least 6 characters"),
  confirmUsercode: z.string().min(6, "Please confirm your new usercode"),
}).refine((data) => data.newUsercode === data.confirmUsercode, {
  message: "New usercodes do not match",
  path: ["confirmUsercode"],
})

type ChangeUsercodeFormData = z.infer<typeof changeUsercodeSchema>

export default function ChangeUsercodePage() {
  const navigate = useNavigate()
  const { changeUsercode, user, isLoading } = useAuthStore()

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangeUsercodeFormData>({
    resolver: zodResolver(changeUsercodeSchema),
  })

  const onSubmit = async (data: ChangeUsercodeFormData) => {
    try {
      await changeUsercode(data.currentUsercode, data.newUsercode, data.confirmUsercode)
      setSuccess(true)
      setTimeout(() => {
        navigate("/account")
      }, 3000)
    } catch (err: any) {
      // Error handled by store
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">Usercode Changed!</CardTitle>
              <CardDescription>
                Your usercode has been successfully updated.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                You'll be redirected to your account settings in a few seconds...
              </p>
              <Button asChild>
                <Link to="/account">Go to Account Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <CreditCard className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Change Usercode</CardTitle>
            <CardDescription>
              Update your login credentials for security
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                <p><strong>Current User:</strong> {user?.username}</p>
                <p className="text-xs mt-1">Enter your current usercode to verify your identity</p>
              </div>

              {/* Current Usercode */}
              <div className="space-y-2">
                <Label htmlFor="currentUsercode">Current Usercode</Label>
                <div className="relative">
                  <Input
                    id="currentUsercode"
                    type={showCurrent ? "text" : "password"}
                    {...register("currentUsercode")}
                    placeholder="Enter current usercode"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.currentUsercode && (
                  <p className="text-sm text-red-500">{errors.currentUsercode.message}</p>
                )}
              </div>

              {/* New Usercode */}
              <div className="space-y-2">
                <Label htmlFor="newUsercode">New Usercode</Label>
                <div className="relative">
                  <Input
                    id="newUsercode"
                    type={showNew ? "text" : "password"}
                    {...register("newUsercode")}
                    placeholder="Enter new usercode (min 6 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.newUsercode && (
                  <p className="text-sm text-red-500">{errors.newUsercode.message}</p>
                )}
              </div>

              {/* Confirm New Usercode */}
              <div className="space-y-2">
                <Label htmlFor="confirmUsercode">Confirm New Usercode</Label>
                <div className="relative">
                  <Input
                    id="confirmUsercode"
                    type={showConfirm ? "text" : "password"}
                    {...register("confirmUsercode")}
                    placeholder="Confirm new usercode"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmUsercode && (
                  <p className="text-sm text-red-500">{errors.confirmUsercode.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Change Usercode
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                <Link to="/account" className="text-primary hover:underline">
                  Back to Account Settings
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
