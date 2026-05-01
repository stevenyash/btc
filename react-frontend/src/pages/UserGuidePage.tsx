import { Link } from "react-router-dom"
import { 
  BookOpen, 
  Video, 
  HelpCircle, 
  MessageCircle,
  Phone,
  Mail,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Layout from "@/components/Layout"

export default function UserGuidePage() {
  const guideSections = [
    {
      title: "Getting Started",
      icon: BookOpen,
      articles: [
        {
          title: "Logging In",
          description: "Access your account securely",
          steps: [
            "Enter your phone/email and usercode",
            "Click 'Sign in'",
            "You'll be redirected to your dashboard",
            "If you forget your usercode, use the 'Forgot usercode' link"
          ]
        }
      ]
    },
    {
      title: "Subscriptions & Payments",
      icon: Video,
      articles: [
        {
          title: "Choosing a Subscription Plan",
          description: "Find the right plan for your learning needs",
          steps: [
            "Navigate to the 'Subscriptions' page",
            "Review available monthly plans",
            "Or explore 'Packages' for specialized bundles",
            "Select your preferred plan and click 'Subscribe Now'"
          ]
        },
        {
          title: "Making Payments via M-Pesa",
          description: "Complete your purchase securely",
          steps: [
            "Enter your M-Pesa registered phone number",
            "Click 'Pay' to receive an STK push",
            "Check your phone and enter your M-Pesa PIN",
            "Wait for confirmation – you'll receive an SMS receipt"
          ]
        },
        {
          title: "Lesson Purchase (Guest Users)",
          description: "Buy individual lessons without a subscription",
          steps: [
            "Browse lessons on the 'Go to Class' page",
            "Select a lesson and click 'Buy'",
            "Enter your phone number and email",
            "Complete the M-Pesa payment",
            "Access your purchased lesson immediately"
          ]
        }
      ]
    },
    {
      title: "Learning & Progress",
      icon: HelpCircle,
      articles: [
        {
          title: "Watching Video Lessons",
          description: "Start learning right away",
          steps: [
            "Go to 'Go to Class' from the navigation",
            "Select your learning level, then grade, then subject",
            "Click 'Watch Now' on any lesson",
            "Your progress is automatically tracked",
            "Continue where you left off anytime"
          ]
        },
        {
          title: "Weekend Tutorials",
          description: "Join intensive weekend sessions",
          steps: [
            "Navigate to 'Weekend Lessons'",
            "Select your child's learning level and grade",
            "Verify your phone number",
            "Browse available tutorials and register",
            "Pay via M-Pesa to secure your spot",
            "Receive SMS with Google Meet link before class"
          ]
        }
      ]
    },
    {
      title: "Support & Help",
      icon: MessageCircle,
      articles: [
        {
          title: "Getting Help",
          description: "We're here to support you",
          steps: [
            "Check this guide for common questions",
            "Visit the FAQ sections on various pages",
            "Contact us via phone: +254 722 310 358",
            "Email: info@bitstutorconnect.co.ke",
            "Visit our office: P.O Box 955-90200, Kitui"
          ]
        },
        {
          title: "Troubleshooting",
          description: "Common issues and solutions",
          steps: [
            "Payment not reflecting? Check your M-Pesa message and use reference input",
            "Video won't play? Ensure stable internet and try refreshing",
            "Can't login? Use 'Forgot usercode' to reset",
            "Still stuck? Contact our support team"
          ]
        }
      ]
    }
  ]

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            User <span className="text-primary">Guide</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about using Bits Tutor Connect. 
            Learn how to navigate, subscribe, and start learning.
          </p>
        </div>
      </section>

      {/* Guide Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Welcome to Bits Tutor Connect!</h2>
                <p className="text-muted-foreground mb-4">
                  This guide will help you make the most of our platform. Whether you're a student, 
                  parent, or educator, you'll find step-by-step instructions for every feature.
                </p>
              <div className="flex flex-wrap gap-3">
                   <Button asChild variant="outline">
                     <Link to="/contactus">
                       Contact Support
                     </Link>
                   </Button>
                 </div>
              </CardContent>
            </Card>

            {/* Guide Sections */}
            {guideSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.articles.map((article, articleIndex) => (
                    <Card key={articleIndex} className="card-learning">
                      <CardHeader>
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription>{article.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-2">
                          {article.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-3">
                              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                                {stepIndex + 1}
                              </span>
                              <span className="text-sm text-muted-foreground">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* FAQ Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <Card className="card-learning">
                  <CardHeader>
                    <CardTitle className="text-base">Can I cancel my subscription anytime?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Yes! You can cancel your subscription at any time. Your access will continue until the end of your current billing period. No partial refunds are given for cancellations.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-learning">
                  <CardHeader>
                    <CardTitle className="text-base">How do weekend tutorials work?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Weekend tutorials are live online sessions via Google Meet. After registering and paying, you'll receive an SMS with a class link. Sessions run every Saturday and Sunday at scheduled times.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-learning">
                  <CardHeader>
                    <CardTitle className="text-base">What happens if I don't use all my lesson credits?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Lesson credits (balance) expire when your subscription expires. We encourage regular learning to get the most value from your package.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-learning">
                  <CardHeader>
                    <CardTitle className="text-base">Is there a money-back guarantee?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Yes, we offer a 7-day money-back guarantee. If you're not satisfied with our service, contact us within 7 days of purchase for a full refund.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Still Need Help */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-bold mb-3">Still Need Help?</h2>
                <p className="text-muted-foreground mb-6">
                  Our support team is available to assist you with any questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <a href="tel:+254722310358">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Us
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="mailto:info@bitstutorconnect.co.ke">
                      <Mail className="mr-2 h-4 w-4" />
                      Email Us
                    </a>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to="/contactus">
                      Send Message
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  )
}
