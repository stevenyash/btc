import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function {{PageName}}() {
  return (
    <div className="min-h-screen bg-base-200 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">{{PageName}}</h1>
        <Card>
          <CardHeader>
            <CardTitle>{{PageName}}</CardTitle>
            <CardDescription>Page description here</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content goes here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
