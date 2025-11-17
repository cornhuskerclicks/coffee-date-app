"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, Mail, MessageSquare, CheckCircle, Clock } from 'lucide-react'
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

const mockLeads = [
  { id: 1, name: "John Smith", source: "LinkedIn", status: "pending", lastMessage: "2 days ago", replied: false },
  { id: 2, name: "Sarah Johnson", source: "Email", status: "sent", lastMessage: "1 day ago", replied: true },
  { id: 3, name: "Mike Davis", source: "CRM", status: "pending", lastMessage: "3 days ago", replied: false },
  { id: 4, name: "Emily Brown", source: "LinkedIn", status: "sent", lastMessage: "4 hours ago", replied: false },
  { id: 5, name: "David Wilson", source: "Email", status: "completed", lastMessage: "1 week ago", replied: true },
]

export default function DeadLeadRevivalPage() {
  const [channel, setChannel] = useState("email")
  const [tone, setTone] = useState("friendly")
  const [selectedLead, setSelectedLead] = useState<typeof mockLeads[0] | null>(mockLeads[1])
  const [replyMessage, setReplyMessage] = useState("")
  const { toast } = useToast()

  const handleUpload = () => {
    toast({
      title: "File Uploaded",
      description: "CSV file processed successfully",
    })
  }

  const handleStartCampaign = () => {
    toast({
      title: "Campaign Started",
      description: "Revival messages are being sent",
    })
  }

  const handleSendMessage = () => {
    toast({
      title: "Message Sent",
      description: "Your message has been delivered",
    })
    setReplyMessage("")
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dead Lead Revival Engine</h1>
        <p className="text-muted-foreground">Automatically revive and engage cold leads</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Drop CSV file here or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supported format: CSV with name, email, phone
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="polite">Polite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleStartCampaign} className="w-full">
                Start Revival Campaign
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Reply</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.source}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            lead.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : lead.status === "sent"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {lead.status === "completed" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell>{lead.lastMessage}</TableCell>
                      <TableCell>
                        {lead.replied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Inbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedLead ? (
              <>
                <div className="space-y-2">
                  <div className="font-semibold">{selectedLead.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedLead.source}</div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">
                      Hi {selectedLead.name}, I wanted to follow up on our previous conversation...
                    </p>
                    <span className="text-xs text-muted-foreground">Sent 1 day ago</span>
                  </div>

                  {selectedLead.replied && (
                    <div className="bg-primary/10 p-3 rounded-lg ml-4">
                      <p className="text-sm">Thanks for reaching out! I'd be interested to learn more.</p>
                      <span className="text-xs text-muted-foreground">Received 12 hours ago</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium text-sm">AI Reply Suggestion</div>
                  <p className="text-sm">
                    Great to hear from you! I'd love to share how we've helped similar businesses achieve [specific
                    result]. Would you be available for a 15-minute call this week?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Your Message</Label>
                  <Textarea
                    placeholder="Edit the message or write your own..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleSendMessage} className="w-full">
                  Approve & Send
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select a lead to view conversation
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
