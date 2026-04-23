import { Link, useNavigate } from "react-router-dom"
import { ShieldX, Home, ArrowLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Layout from "@/components/Layout"

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-slate-900 to-slate-900 p-4">
        <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-red-500/20">403</h1>
              <div className="relative -mt-20 mb-4">
                <ShieldX className="h-24 w-24 mx-auto text-red-500" />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4">Access Denied</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              You don't have permission to access this page. 
              Please contact your administrator if you believe this is an error.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="btn-primary">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Go Home
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Button>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Need help? Contact support</span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/contactus">Contact Support</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/guide">User Guide</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-white/60">
          Error 403 - You do not have permission to view this resource.
        </p>
      </div>
    </Layout>
  )
}
