import { Link } from "react-router-dom"
import { Home, Search, BookOpen, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Layout from "@/components/Layout"

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            {/* 404 Illustration */}
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-primary/20">404</h1>
              <div className="relative -mt-20 mb-4">
                <BookOpen className="h-24 w-24 mx-auto text-primary" />
              </div>
            </div>

            {/* Message */}
            <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              Oops! The page you're looking for seems to have gone missing. 
              Don't worry, you can find your way back from here.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="btn-primary">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Go Home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/gotoclass">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Lessons
                </Link>
              </Button>
            </div>

            {/* Help Links */}
            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Looking for something specific?
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/aboutus">About Us</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/contactus">Contact Support</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/guide">User Guide</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/subscriptions">View Subscriptions</Link>
                </Button>
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-8">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back to Previous Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fun Message */}
        <p className="mt-6 text-center text-sm text-white/60">
          Error 404 - The content you seek is hiding in another dimension... or maybe you typed the URL wrong.
        </p>
      </div>
    </Layout>
  )
}
