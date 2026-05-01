/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Save, Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { useAuthStore } from "@/stores/useAuthStore"
import { useSubscriptionStore } from "@/stores/useSubscriptionStore"

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function AccountSettingsPage() {
  const navigate = useNavigate()
   const { user, updateProfile, isLoading } = useAuthStore()
   const { packages } = useSubscriptionStore()

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true)
    setMessage(null)
    try {
      await updateProfile(data)
      setMessage({ type: "success", text: "Profile updated successfully!" })
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to update profile",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Account <span className="text-primary">Settings</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your profile and account preferences
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>
      </section>

      {/* Settings Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Settings */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      {message && (
                        <div
                          className={`p-3 rounded-md text-sm ${
                            message.type === "success"
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {message.text}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          {...register("username")}
                          placeholder="johndoe"
                        />
                        {errors.username && (
                          <p className="text-sm text-red-500">{errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="john@example.com"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...register("phone")}
                          placeholder="+254700000000"
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500">{errors.phone.message}</p>
                        )}
                      </div>

                      <Button type="submit" disabled={isSaving || isLoading}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Change Usercode Card */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Change Usercode
                    </CardTitle>
                    <CardDescription>
                      Update your login credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      For security reasons, you can change your usercode here.
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/settings">
                        Change Usercode
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Account Summary */}
              <div className="space-y-6">
                {/* Subscription Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Subscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {packages && packages.length > 0 ? (
                      <div>
                        <p className="font-semibold text-lg">{packages[0].name}</p>
                        <p className="text-sm text-muted-foreground">
                          {packages[0].no_of_lessons} lessons • {packages[0].duration_amount} {packages[0].duration_unit}
                        </p>
                        <p className="text-sm text-primary font-medium mt-2">
                          Fee: KSh {packages[0].fee?.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted-foreground">No active subscription</p>
                        <Button asChild variant="link" className="px-0 mt-2">
                          <Link to="/packages">View Packages</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Username</p>
                      <p className="font-medium">{user?.username || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{user?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/dashboard">View Dashboard</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/subscriptions">Manage Subscription</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/contactus">Contact Support</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
