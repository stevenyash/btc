/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
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
import { useSubscriptionStore } from "@/stores/useSubscriptionStore"
import { useMpesaStore } from "@/stores/useMpesaStore"
import { formatKenyanPhone } from "@/lib/utils"
import { getReferralCode } from "@/utils/referral"

const paymentSchema = z.object({
  phone: z.string().min(10, "Please enter a valid Kenyan phone number"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PackageInfo {
  id: string;
  subscription_type_id: number;
  name: string;
  fee: number;
  duration_amount: number;
  duration_unit: string;
  no_of_lessons: number;
  description?: string;
}

export default function PackageCheckoutPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()

  const {
    packages,
    isLoading,
    error,
    fetchPackages,
    clearError,
    hasActiveSubscription,
    isAuthorized,
    subscriptionPlans,
    fetchSubscriptionPlans,
    fetchSubscriberDetails
  } = useSubscriptionStore()

   const { pay, status } = useMpesaStore()

  const isSubscribed = isAuthorized || hasActiveSubscription
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [subscriptionFee, setSubscriptionFee] = useState<number>(0)

  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null)
  const [paymentStep, setPaymentStep] = useState<"form" | "processing" | "success">("form")

   // Watch M-Pesa status and update payment step
   useEffect(() => {
     if (status === "success") {
       setPaymentStep("success")
     } else if (status === "error") {
       setPaymentStep("form")
     } else if (status === "pending") {
       setPaymentStep("processing")
     }
   }, [status])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  })

  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=/packages/buy/${id}`)
      return
    }
    if (user?.phone) {
      setValue("phone", formatKenyanPhone(user.phone))
    }
    if (user?.email && !isSubscribed) {
      setValue("email", user.email)
    }
  }, [user, setValue, isSubscribed, navigate, id])

  useEffect(() => {
    fetchPackages()
    fetchSubscriberDetails()
  }, [fetchPackages, fetchSubscriberDetails])

  useEffect(() => {
    if (!isSubscribed && subscriptionPlans.length === 0) {
      fetchSubscriptionPlans()
    }
  }, [isSubscribed, subscriptionPlans, fetchSubscriptionPlans])

  useEffect(() => {
    if (selectedPackage) {
      if (isSubscribed) {
        setTotalAmount(selectedPackage.fee)
        setSubscriptionFee(0)
      } else {
        const packagePlan = subscriptionPlans.find(
          plan => plan.id === selectedPackage.subscription_type_id
        )
        if (packagePlan) {
          setSubscriptionFee(packagePlan.membership_fee)
          setTotalAmount(selectedPackage.fee + packagePlan.membership_fee)
        } else {
          setTotalAmount(0)
          setSubscriptionFee(0)
        }
      }
    }
  }, [selectedPackage, isSubscribed, subscriptionPlans])

  useEffect(() => {
    if (id && packages && Array.isArray(packages) && packages.length > 0) {
      const pkg = packages.find(p => p.id.toString() === id)
      if (pkg) {
        setSelectedPackage({
          id: pkg.id.toString(),
          subscription_type_id: pkg.subscription_type_id,
          name: pkg.name,
          fee: pkg.fee,
          duration_amount: pkg.duration_amount,
          duration_unit: pkg.duration_unit,
          no_of_lessons: pkg.no_of_lessons,
          description: pkg.description,
        })
      }
    }
  }, [id, packages])

  const onSubmit = async (data: PaymentFormData) => {
    if (!selectedPackage) {
      return
    }

    clearError()
    setPaymentStep("processing")

    try {
      const formattedPhone = formatKenyanPhone(data.phone)
      const result = await pay(totalAmount, formattedPhone, `PACKAGE_${selectedPackage.id}`, {
        activationType: isSubscribed ? 'package' : 'package_with_subscription',
        planId: selectedPackage.id.toString(),
        planName: selectedPackage.name,
        referralCode: getReferralCode() || undefined,
        ...(!isSubscribed && data.email && { email: data.email })
      })

      if (result.success && result.checkoutId) {
        // Payment initiated, verification happens via callback
      } else {
        setPaymentStep("form")
      }
    } catch (err: any) {
      setPaymentStep("form")
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-red-500">Error Loading Package</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => fetchPackages()}>Retry</Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    )
  }

  if (!selectedPackage) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Package Not Found</CardTitle>
              <CardDescription>The package you are looking for does not exist.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/packages">View All Packages</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    )
  }

    if (paymentStep === "success") {
      return (
        <Layout>
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold text-green-600">Payment Completed!</CardTitle>
                <CardDescription>
                  Your package and subscription have been activated.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col space-y-4">
                <Button onClick={() => navigate("/")} className="w-full">
                  Go Home
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Layout>
      )
    }

  if (paymentStep === "processing") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <CardTitle className="text-xl">Processing Payment...</CardTitle>
              <CardDescription>
                Please check your phone and enter your M-PESA PIN
              </CardDescription>
            </CardHeader>
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
            <CardTitle className="text-2xl font-bold">Purchase Package</CardTitle>
            <CardDescription>
              {selectedPackage.name} - KSh {selectedPackage.fee} / {selectedPackage.duration_unit}
            </CardDescription>
          </CardHeader>
          {!isSubscribed && subscriptionFee > 0 && (
            <div className="mx-6 mb-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              You don't have an active subscription. A subscription fee of KSh {subscriptionFee} will be added to the package fee.
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              {selectedPackage && (
                <div className="space-y-2 rounded-lg bg-primary/10 p-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Package:</span>
                    <span>{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Lessons:</span>
                    <span>{selectedPackage.no_of_lessons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Duration:</span>
                    <span>{selectedPackage.duration_amount} {selectedPackage.duration_unit}(s)</span>
                  </div>
                  {!isSubscribed && subscriptionFee > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium">Subscription Fee:</span>
                        <span>KSh {subscriptionFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Package Fee:</span>
                        <span>KSh {selectedPackage.fee}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t pt-2 text-xl font-bold">
                    <span>Total:</span>
                    <span>KSh {totalAmount}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07XXXXXXXX or 254XXXXXXXXX"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              {!isSubscribed && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || !selectedPackage || totalAmount === 0}>
                {isLoading ? "Processing..." : `Pay KSh ${totalAmount} with M-PESA`}
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/packages">View All Packages</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
