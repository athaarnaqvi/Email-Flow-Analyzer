"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailResult {
  id: string;
  from: string;
  to: string[];
  subject: string;
  destinationIp: string;
  sourceIp: string;
  timestamp: string;
  protocol: string;
  messageId: string;
  correlation: {
    cgnatMatched: boolean;
    radiusSessionFound: boolean;
  };
  highlight: Record<string, string[]> | null;
  score: number | null;
}

interface SearchResponse {
  results: EmailResult[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

function EmailSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("email") || "");
  const [msisdn, setMsisdn] = useState("");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [protocol, setProtocol] = useState(searchParams.get("protocol") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState(searchParams.get("sortField") || "timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const itemsPerPage = 10;

  const updateUrlParams = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const values: Record<string, string> = {
        email: searchQuery,
        startDate,
        endDate,
        protocol,
        page: String(currentPage),
        sortField,
        sortOrder,
        ...overrides,
      };
      for (const [key, val] of Object.entries(values)) {
        if (val && val !== "all") params.set(key, val);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchQuery, startDate, endDate, protocol, currentPage, sortField, sortOrder, router]
  );

  const fetchResults = useCallback(
    async (page: number, field?: string, order?: string) => {
      setIsSearching(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("email", searchQuery);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (protocol && protocol !== "all") params.set("protocol", protocol);
        params.set("page", page.toString());
        params.set("size", itemsPerPage.toString());
        params.set("sortField", field || sortField);
        params.set("sortOrder", order || sortOrder);

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.details || errData.error || "Search failed");
        }
        const data: SearchResponse = await res.json();
        setSearchResponse(data);
        setCurrentPage(data.page);
        setHasSearched(true);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
        setSearchResponse(null);
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, startDate, endDate, protocol, sortField, sortOrder]
  );

  useEffect(() => {
    const hasParams = searchParams.get("email") || searchParams.get("startDate") || searchParams.get("endDate") || searchParams.get("protocol");
    if (hasParams) {
      const page = Number(searchParams.get("page")) || 1;
      const field = searchParams.get("sortField") || "timestamp";
      const order = searchParams.get("sortOrder") || "desc";
      fetchResults(page, field, order);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    setSelectedEmails([]);
    await fetchResults(1);
    updateUrlParams({ page: "1" });
  };

  const handlePageChange = async (page: number) => {
    await fetchResults(page);
    updateUrlParams({ page: String(page) });
  };

  const handleSort = async (field: string) => {
    const newOrder =
      sortField === field && sortOrder === "desc" ? "asc" : "desc";
    setSortField(field);
    setSortOrder(newOrder);

    if (hasSearched) {
      await fetchResults(1, field, newOrder);
      updateUrlParams({ page: "1", sortField: field, sortOrder: newOrder });
    }
  };

  const results = searchResponse?.results || [];
  const totalResults = searchResponse?.total || 0;
  const totalPages = searchResponse?.totalPages || 0;

  const handleSelectAll = (checked: boolean) => {
    const currentPageIds = results.map((r) => r.id);
    if (checked) {
      setSelectedEmails((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    } else {
      setSelectedEmails((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const handleSelectEmail = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails((prev) => [...prev, id]);
    } else {
      setSelectedEmails((prev) => prev.filter((e) => e !== id));
    }
  };

  const allOnPageSelected = results.length > 0 && results.every((r) => selectedEmails.includes(r.id));
  const someOnPageSelected = results.some((r) => selectedEmails.includes(r.id));

  const handleDownloadTarGz = async () => {
    if (selectedEmails.length === 0) return;
    setIsDownloading(true);
    try {
      const res = await fetch("/api/email/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedEmails }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emails-${new Date().toISOString().slice(0, 10)}.tar.gz`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsDownloading(false);
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

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return ts;
    }
  };

  const handleExportCSV = () => {
    if (!results.length) return;
    const headers = [
      "From",
      "Subject",
      "Source IP",
      "Destination IP",
      "Timestamp",
      "Protocol",
    ];
    const rows = results.map((r) => [
      r.from,
      r.subject,
      r.sourceIp,
      r.destinationIp,
      r.timestamp,
      r.protocol,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-search-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Email Search</h2>
        <p className="text-muted-foreground">
          Search and analyze email communications powered by OpenSearch
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="user@domain.com"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={isSearching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select
                value={protocol}
                onValueChange={setProtocol}
                disabled={isSearching}
              >
                <SelectTrigger id="protocol">
                  <SelectValue placeholder="All protocols" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Protocols</SelectItem>
                  <SelectItem value="SMTP">SMTP</SelectItem>
                  <SelectItem value="IMAP">IMAP</SelectItem>
                  <SelectItem value="POP3">POP3</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="space-y-2">
              <Label htmlFor="msisdn" className="text-muted-foreground">
                MSISDN
              </Label>
              <Input
                id="msisdn"
                placeholder="Coming soon..."
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                disabled={true}
                className="opacity-50"
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

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Search Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {hasSearched && !error && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Search Results</CardTitle>
                <CardDescription>
                  Found{" "}
                  <span className="font-semibold text-foreground">
                    {totalResults.toLocaleString()}
                  </span>{" "}
                  emails matching your criteria
                  {searchResponse && totalPages > 1 && (
                    <span>
                      {" "}
                      &middot; Page {currentPage} of {totalPages}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedEmails.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedEmails.length} selected
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedEmails.length === 0 || isSearching || isDownloading}
                  onClick={handleDownloadTarGz}
                >
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download TAR.GZ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={results.length === 0 || isSearching}
                  onClick={handleExportCSV}
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
                        checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Destination IP</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => handleSort("timestamp")}
                      >
                        Timestamp
                        {getSortIcon("timestamp")}
                      </button>
                    </TableHead>
                    <TableHead>Protocol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((email) => (
                      <TableRow
                        key={email.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/dashboard/email/${email.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedEmails.includes(email.id)}
                            onCheckedChange={(checked) =>
                              handleSelectEmail(email.id, checked as boolean)
                            }
                            aria-label={`Select ${email.subject}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {email.from}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {email.highlight?.["message.subject"] ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: email.highlight["message.subject"][0],
                              }}
                            />
                          ) : (
                            email.subject || (
                              <span className="text-muted-foreground italic">
                                (No Subject)
                              </span>
                            )
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {email.destinationIp}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTimestamp(email.timestamp)}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalResults > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalResults)} of{" "}
                  {totalResults.toLocaleString()} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isSearching}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {generatePaginationPages(currentPage, totalPages).map(
                      (page, idx) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 text-muted-foreground"
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            className="w-8"
                            onClick={() => handlePageChange(page as number)}
                            disabled={isSearching}
                          >
                            {page}
                          </Button>
                        )
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isSearching}
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

export default function EmailSearchPage() {
  return (
    <Suspense>
      <EmailSearchContent />
    </Suspense>
  );
}

function generatePaginationPages(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  if (total > 1) {
    pages.push(total);
  }

  return pages;
}
