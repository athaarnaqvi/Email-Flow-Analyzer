"use client";
import React, { useState } from "react";

interface EmailHit {
  _id: string;
  _source: any;
}

export default function EmailSearchPage() {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState<EmailHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const handleSearch = async (page = 0) => {
    setLoading(true);
    setFrom(page * size);
    const params = new URLSearchParams();
    if (email) params.append("email", email);
    if (domain) params.append("domain", domain);
    if (msisdn) params.append("msisdn", msisdn);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("from", String(page * size));
    params.append("size", String(size));
    const res = await fetch(`/api/email-search?${params.toString()}`);
    const data = await res.json();
    setResults(data.hits?.hits || []);
    setTotal(data.hits?.total?.value || 0);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Email Search (OpenSearch)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          className="border p-2 rounded"
          placeholder="Email address (To, From, Cc, Bcc)"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Email domain (e.g. example.com)"
          value={domain}
          onChange={e => setDomain(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="MSISDN"
          value={msisdn}
          onChange={e => setMsisdn(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="datetime-local"
            className="border p-2 rounded w-full"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <input
            type="datetime-local"
            className="border p-2 rounded w-full"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => handleSearch(0)}
        disabled={loading}
      >
        {loading ? "Searching..." : "Search"}
      </button>
      <div>
        <p className="mb-2">{total} results found</p>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">From</th>
              <th className="border px-2 py-1">Subject</th>
              <th className="border px-2 py-1">Destination IP</th>
              <th className="border px-2 py-1">Timestamp</th>
              <th className="border px-2 py-1">Protocol</th>
            </tr>
          </thead>
          <tbody>
            {results.map(hit => {
              const src = hit._source;
              return (
                <tr key={hit._id}>
                  <td className="border px-2 py-1">{src.email?.from || "-"}</td>
                  <td className="border px-2 py-1">{src.message?.subject || "-"}</td>
                  <td className="border px-2 py-1">{src.network?.destination?.ip || "-"}</td>
                  <td className="border px-2 py-1">{src.timestamp ? new Date(src.timestamp).toLocaleString() : "-"}</td>
                  <td className="border px-2 py-1">{src.network?.protocol || "-"}</td>
                </tr>
              );
            })}
            {results.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">No results</td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex gap-2 mt-4">
          <button
            className="px-3 py-1 border rounded"
            onClick={() => handleSearch(Math.max(0, from / size - 1))}
            disabled={from === 0 || loading}
          >
            Previous
          </button>
          <span>Page {Math.floor(from / size) + 1} of {Math.ceil(total / size) || 1}</span>
          <button
            className="px-3 py-1 border rounded"
            onClick={() => handleSearch(Math.floor(from / size + 1))}
            disabled={from + size >= total || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
