"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  FileSpreadsheet,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailResult {
  id: string;
  from: string;
  subject: string;
  destinationIp: string;
  timestamp: string;
  protocol: "SMTP" | "IMAP" | "POP3";
}

// Mock data
const mockResults: EmailResult[] = [
  {
    id: "1",
    from: "john.doe@example.com",
    subject: "Q4 Financial Report",
    destinationIp: "192.168.1.100",
    timestamp: "2024-01-15 14:32:00",
    protocol: "SMTP",
  },
  {
    id: "2",
    from: "jane.smith@company.org",
    subject: "Meeting Schedule Update",
    destinationIp: "10.0.0.45",
    timestamp: "2024-01-15 13:15:00",
    protocol: "IMAP",
  },
  {
    id: "3",
    from: "support@service.net",
    subject: "Your ticket has been resolved",
    destinationIp: "172.16.0.88",
    timestamp: "2024-01-15 12:45:00",
    protocol: "POP3",
  },
  {
    id: "4",
    from: "alerts@monitoring.io",
    subject: "System Alert: High CPU Usage",
    destinationIp: "192.168.2.50",
    timestamp: "2024-01-15 11:22:00",
    protocol: "SMTP",
  },
  {
    id: "5",
    from: "newsletter@updates.com",
    subject: "Weekly Digest - January",
    destinationIp: "10.10.10.10",
    timestamp: "2024-01-15 10:00:00",
    protocol: "SMTP",
  },
  {
    id: "6",
    from: "hr@enterprise.corp",
    subject: "Policy Update Notice",
    destinationIp: "192.168.3.25",
    timestamp: "2024-01-15 09:30:00",
    protocol: "IMAP",
  },
  {
    id: "7",
    from: "noreply@bank.com",
    subject: "Transaction Confirmation",
    destinationIp: "10.0.1.200",
    timestamp: "2024-01-15 08:45:00",
    protocol: "SMTP",
  },
  {
    id: "8",
    from: "admin@internal.local",
    subject: "Password Reset Request",
    destinationIp: "172.16.5.100",
    timestamp: "2024-01-15 08:00:00",
    protocol: "POP3",
  },
];

export default function EmailSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = async () => {
    setIsSearching(true);
    setSelectedEmails([]);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setResults(mockResults);
    setHasSearched(true);
    setCurrentPage(1);
    setIsSearching(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(paginatedResults.map((r) => r.id));
    } else {
      setSelectedEmails([]);
    }
  };

  const handleSelectEmail = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails([...selectedEmails, id]);
    } else {
      setSelectedEmails(selectedEmails.filter((e) => e !== id));
    }
  };

  const getProtocolBadgeColor = (protocol: string) => {
    switch (protocol) {
      case "SMTP":
        return "bg-primary/20 text-primary";
      case "IMAP":
        return "bg-chart-2/20 text-chart-2";
      case "POP3":
        return "bg-chart-3/20 text-chart-3";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Email Search</h2>
        <p className="text-muted-foreground">
          Search and analyze email communications
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Filters</CardTitle>
          <CardDescription>
            Enter search criteria to find specific emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="user@domain.com"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msisdn">MSISDN</Label>
              <Input
                id="msisdn"
                placeholder="+1234567890"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSearching}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Search Results</CardTitle>
                <CardDescription>
                  Found {results.length} emails matching your criteria
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedEmails.length === 0 || isSearching}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download TAR.GZ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={results.length === 0 || isSearching}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          paginatedResults.length > 0 &&
                          paginatedResults.every((r) =>
                            selectedEmails.includes(r.id)
                          )
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Destination IP</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead className="w-20">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedResults.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEmails.includes(email.id)}
                            onCheckedChange={(checked) =>
                              handleSelectEmail(email.id, checked as boolean)
                            }
                            aria-label={`Select ${email.subject}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {email.from}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {email.subject}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {email.destinationIp}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {email.timestamp}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                              getProtocolBadgeColor(email.protocol)
                            )}
                          >
                            {email.protocol}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/email/${email.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {results.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, results.length)} of{" "}
                  {results.length} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-8"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
