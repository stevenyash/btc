/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, Shield, ArrowRight, Users, Clock, Star, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { useSubscriptionStore } from "@/stores/useSubscriptionStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { MpesaPaymentModule } from "@/components/MpesaPaymentModule"
import { useMpesaStore } from "@/stores/useMpesaStore"

const faqs = [
  {
    question: "How do I subscribe?",
    answer: "Simply choose a plan that suits your needs and click the Subscribe button. You can pay via M-Pesa."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 7-day money-back guarantee. If you're not satisfied, contact us within 7 days for a full refund."
  },
  {
    question: "Can I switch plans?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. The price difference will be prorated."
  }
]

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const { 
    subscriptionPlans, 
    isLoading, 
    error, 
    fetchSubscriptionPlans
  } = useSubscriptionStore()
  const { reset: resetMpesa } = useMpesaStore()
  const { user } = useAuthStore()
  
  const [selectedPlan, setSelectedPlan] = useState<{ id: number; name: string; membership_fee: number } | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    fetchSubscriptionPlans()
  }, [])

  const handleSubscribe = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    setShowPayment(false)
    setSelectedPlan(null)
    resetMpesa()
    // Redirect to dashboard
    navigate("/dashboard")
  }

  const handlePaymentFailure = () => {
    // Keep modal open for retry
  }

  const closePayment = () => {
    setShowPayment(false)
    setSelectedPlan(null)
    resetMpesa()
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-red-500">Error Loading Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => fetchSubscriptionPlans()} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  type Plan = { id: number; name: string; description: string | null; membership_fee: number }

  const displayPlans: Plan[] = Array.isArray(subscriptionPlans) ? subscriptionPlans : []

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your <span className="text-primary">Learning Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Unlock your potential with our flexible subscription plans. 
            Start learning today and achieve your goals.
          </p>
          
          
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section-learning">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {displayPlans.map((plan, index) => (
              <Card key={plan.id ?? index} className="card-learning">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description || `Access to learning content`}</CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">KSh</span>
                    <span className="text-5xl font-bold">
                      {plan.membership_fee}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardContent>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Access to video lessons</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Progress tracking</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSubscribe(plan)}
                    className="w-full btn-outline"
                  >
                    Subscribe Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-learning-alt py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Subscribe?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Expert Tutors</h3>
              <p className="text-sm text-muted-foreground">Learn from qualified teachers with years of experience</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Learn Anytime</h3>
              <p className="text-sm text-muted-foreground">Access content 24/7 at your own pace</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quality Content</h3>
              <p className="text-sm text-muted-foreground">Comprehensive curriculum designed by experts</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">Secure M-Pesa payment options</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-learning py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="card-learning">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-learning-alt py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-8">
            Contact our support team and we'll help you find the right plan.
          </p>
          <Button asChild size="lg">
            <Link to="/contactus">
              Contact Us
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <button 
              onClick={closePayment}
              className="absolute -top-2 -right-2 z-10 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
            <MpesaPaymentModule
              amount={selectedPlan.membership_fee}
              accountReference={`SUBSCRIPTION_${selectedPlan.id}`}
              defaultPhone={user?.phone}
              businessMetadata={{ 
                activationType: 'subscription',
                planId: selectedPlan.id, 
                planName: selectedPlan.name 
              }}
              onSuccess={(transaction) => {
                console.log("Payment successful:", transaction)
                handlePaymentSuccess()
              }}
              onFailure={(error) => {
                console.log("Payment failed:", error)
                handlePaymentFailure()
              }}
            />
          </div>
        </div>
      )}
    </Layout>
  )
}