"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendingUp, Users, DollarSign, MessageSquare } from 'lucide-react'

const mockClients = [
  {
    id: 1,
    name: "TechCorp Inc",
    campaign: "Q1 Revival",
    leadsRevived: 45,
    replyRate: "32%",
    conversion: "12%",
    lastSync: "2 hours ago",
  },
  {
    id: 2,
    name: "StartupXYZ",
    campaign: "Email Outreach",
    leadsRevived: 89,
    replyRate: "28%",
    conversion: "15%",
    lastSync: "5 hours ago",
  },
  {
    id: 3,
    name: "Enterprise Solutions",
    campaign: "SMS Revival",
    leadsRevived: 124,
    replyRate: "41%",
    conversion: "18%",
    lastSync: "1 day ago",
  },
  {
    id: 4,
    name: "GrowthAgency",
    campaign: "Multi-Channel",
    leadsRevived: 67,
    replyRate: "35%",
    conversion: "14%",
    lastSync: "3 hours ago",
  },
]

export default function ClientDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <p className="text-muted-foreground">Monitor client campaigns and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold">325</div>
            <div className="text-sm text-muted-foreground">Total Leads Revived</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold">34%</div>
            <div className="text-sm text-muted-foreground">Avg Reply Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold">$124K</div>
            <div className="text-sm text-muted-foreground">Money Recovered</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold">48</div>
            <div className="text-sm text-muted-foreground">Total Bookings</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client Campaigns</CardTitle>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="techcorp">TechCorp Inc</SelectItem>
                  <SelectItem value="startup">StartupXYZ</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="7days">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all-channels">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-channels">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Leads Revived</TableHead>
                <TableHead>Reply Rate</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Last Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.campaign}</TableCell>
                  <TableCell>{client.leadsRevived}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      {client.replyRate}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                      {client.conversion}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.lastSync}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
