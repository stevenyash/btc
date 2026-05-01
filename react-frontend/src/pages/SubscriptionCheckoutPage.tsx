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
import { useSubscriptionStore } from "@/stores/useSubscriptionStore"
import { formatKenyanPhone } from "@/lib/utils"

const paymentSchema = z.object({
  phone: z.string().min(10, "Please enter a valid Kenyan phone number"),
  email: z.string().email("Please enter a valid email address"),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PackageInfo {
  id: string;
  name: string;
  fee: number;
  duration_amount: number;
  duration_unit: string;
  no_of_lessons: number;
  description?: string;
}

export default function SubscriptionCheckoutPage() {
  const navigate = useNavigate()
  const { packageId } = useParams()
  
  const {
    packages,
    isLoading,
    error,
    fetchPackages,
    initiatePayment,
    clearError
  } = useSubscriptionStore()
  
   const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null)
   const [paymentStep, setPaymentStep] = useState<"form" | "processing" | "success">("form")

   const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  })

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  useEffect(() => {
    if (packageId && packages.length > 0) {
      const pkg = packages.find(p => p.id.toString() === packageId)
      if (pkg) {
        setSelectedPackage({
          id: pkg.id.toString(),
          name: pkg.name,
          fee: pkg.fee,
          duration_amount: pkg.duration_amount,
          duration_unit: pkg.duration_unit,
          no_of_lessons: pkg.no_of_lessons,
          description: pkg.description,
        })
      }
    } else if (packages.length > 0 && !packageId) {
      // Default to first package if none selected
      const pkg = packages[0]
      setSelectedPackage({
        id: pkg.id.toString(),
        name: pkg.name,
        fee: pkg.fee,
        duration_amount: pkg.duration_amount,
        duration_unit: pkg.duration_unit,
        no_of_lessons: pkg.no_of_lessons,
        description: pkg.description,
      })
    }
  }, [packageId, packages])

  const onSubmit = async (data: PaymentFormData) => {
    if (!selectedPackage) {
      return
    }

    clearError()
    setPaymentStep("processing")

    try {
      const formattedPhone = formatKenyanPhone(data.phone)
      await initiatePayment(selectedPackage.fee, formattedPhone)
      
      setPaymentStep("success")
    } catch (err: any) {
      setPaymentStep("form")
      // Error is handled by the store
    }
  }

  const handleManualReference = async (reference: string) => {
    setPaymentStep("processing")
    try {
      const { searchTransaction } = useSubscriptionStore.getState()
      await searchTransaction(reference)
      setPaymentStep("success")
    } catch (err) {
      setPaymentStep("form")
    }
  }

  if (paymentStep === "success") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Your subscription has been activated
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-4">
              <Button onClick={() => navigate("/")} className="w-full">
                Start Learning
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
              <div className="mx-auto w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
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
            <CardTitle className="text-2xl font-bold">Subscribe</CardTitle>
            <CardDescription>
              {selectedPackage
                ? `${selectedPackage.name} - KSh ${selectedPackage.fee}/${selectedPackage.duration_unit}`
                : "Select a package"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              {selectedPackage && (
                <div className="p-4 bg-primary/10 rounded-lg space-y-2">
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
                  <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>KSh {selectedPackage.fee}</span>
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || !selectedPackage}>
                {isLoading ? "Processing..." : "Pay with M-PESA"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Paid via M-PESA PayBill?</p>
                <p className="text-xs">Enter your transaction reference below</p>
              </div>
              
              <ReferenceInput onSubmit={handleManualReference} isLoading={isLoading} />
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/subscriptions">View All Packages</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  )
}

function ReferenceInput({ onSubmit, isLoading }: { onSubmit: (ref: string) => void; isLoading: boolean }) {
  const [reference, setReference] = useState("")

  return (
    <div className="space-y-2">
      <Input
        type="text"
        placeholder="M-PESA reference number"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <Button
        type="button"
        onClick={() => onSubmit(reference)}
        disabled={!reference || isLoading}
        variant="secondary"
        className="w-full"
      >
        Complete Payment with Reference
      </Button>
    </div>
  )
}