import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Package, Clock, Users, ArrowRight, BookOpen, Video, Loader2, Gift, Zap, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { useSubscriptionStore } from "@/stores/useSubscriptionStore"

const iconColors = ["bg-green-500", "bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-teal-500"]
const icons = [Gift, Calendar, Zap, Users, BookOpen, Video]

function getIcon(index: number) {
  return icons[index % icons.length]
}

function getColor(index: number) {
  return iconColors[index % iconColors.length]
}

export default function PackagesPage() {
  const navigate = useNavigate()
  const { packages: apiPackages, isLoading, error, fetchPackages, isAuthorized, checkSubscription } = useSubscriptionStore()
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string>("")

  useEffect(() => {
    fetchPackages()
    checkSubscription()
  }, [fetchPackages, checkSubscription])

  const handleBuyPackage = (packageId: string) => {
    if (!isAuthorized) {
      setSelectedPackageId(packageId)
      setShowSubscribeModal(true)
      return
    }
    navigate(`/packages/buy/${packageId}`)
  }

  const groupedPackages = apiPackages.reduce<Record<string, typeof apiPackages>>((acc, pkg) => {
    const key = pkg.subscription_type_name || "Other"
    if (!acc[key]) acc[key] = []
    acc[key].push(pkg)
    return acc
  }, {})

  const categoryNames = Object.keys(groupedPackages).sort((a, b) => {
    if (a === "Individual Subscription") return -1
    if (b === "Individual Subscription") return 1
    return a.localeCompare(b)
  })
  const [activeTab, setActiveTab] = useState(categoryNames[0] || "")

  const packageSections = Object.entries(groupedPackages).map(([typeName, pkgs]) => ({
    typeName,
    packages: pkgs.map((pkg, index) => ({
      id: pkg.id.toString(),
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.fee,
      duration: `${pkg.duration_amount} ${pkg.duration_unit}`,
      features: [
        `${pkg.no_of_lessons} lessons included`,
        `Up to ${pkg.concurrent_access} concurrent users`,
        `Valid for ${pkg.duration_amount} ${pkg.duration_unit}`,
        "Access to video lessons",
        "Progress tracking",
        "Certificate of completion"
      ],
      icon: getIcon(index),
      color: getColor(index)
    }))
  }))

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
              <CardTitle className="text-red-500">Error Loading Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => fetchPackages()} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Special <span className="text-primary">Learning Packages</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our specialized packages are designed to help you achieve specific learning goals. 
            Choose the package that best fits your needs.
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="section-learning">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categoryNames.map((category) => (
              <Button
                key={category}
                variant={activeTab === category ? "default" : "outline"}
                onClick={() => setActiveTab(category)}
                className="min-w-[140px]"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Packages for active tab */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {packageSections
              .find((s) => s.typeName === activeTab)
              ?.packages.map((pkg) => (
                <Card key={pkg.id} className="card-learning hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-14 w-14 ${pkg.color} rounded-xl flex items-center justify-center`}>
                        <pkg.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{pkg.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">KSh {pkg.price}</span>
                      <span className="text-muted-foreground">/ {pkg.duration}</span>
                    </div>
                    
                    <div className="space-y-3">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full" onClick={() => handleBuyPackage(pkg.id)}>
                      Buy This Package
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-learning-alt py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Video className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Live Sessions</h3>
              <p className="text-sm text-muted-foreground">Interactive video classes with expert tutors</p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Study Materials</h3>
              <p className="text-sm text-muted-foreground">Comprehensive notes and guides</p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Time</h3>
              <p className="text-sm text-muted-foreground">Learn at your own pace</p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Package className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Certificates</h3>
              <p className="text-sm text-muted-foreground">Earn recognition for your achievement</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-learning py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Package?</h2>
          <p className="text-muted-foreground mb-8">
            We can create a personalized learning package tailored to your specific needs.
          </p>
          <Button asChild size="lg">
            <Link to="/contactus">
              Contact Us for Custom Packages
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Subscribe Required Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md bg-background rounded-lg p-6 shadow-xl">
            <button 
              onClick={() => setShowSubscribeModal(false)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Subscription Required</h2>
              <p className="text-muted-foreground mb-6">
                You need an active subscription to purchase packages. Would you like to subscribe now?
              </p>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => { navigate("/subscriptions") }}>
                  Subscribe Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowSubscribeModal(false)}>
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}