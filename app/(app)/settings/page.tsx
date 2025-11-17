"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Upload } from 'lucide-react'

export default function SettingsPage() {
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your changes have been saved successfully",
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and integration settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>

          <Button onClick={handleSave}>Save Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" placeholder="Enter company name" />
          </div>

          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload logo</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-color">Brand Color</Label>
            <div className="flex gap-2">
              <Input id="brand-color" type="color" defaultValue="#089FEF" className="w-20 h-10" />
              <Input defaultValue="#089FEF" className="flex-1" />
            </div>
          </div>

          <Button onClick={handleSave}>Save Business Info</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ghl">GHL API Key</Label>
            <Input id="ghl" type="password" placeholder="Enter your GHL API key" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio">Twilio Number</Label>
            <Input id="twilio" placeholder="+1 (555) 123-4567" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Custom Domain</Label>
            <Input id="domain" placeholder="yourdomain.com" />
            <p className="text-xs text-muted-foreground">Coming in V2</p>
          </div>

          <Button onClick={handleSave}>Save Integrations</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Billing features coming in V2</p>
        </CardContent>
      </Card>
    </div>
  )
}
