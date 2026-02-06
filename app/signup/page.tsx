"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    function getCookie(name: string) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
    }
    const token = getCookie("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("User created successfully!");
      setUsername("");
      setPassword("");
    } else {
      setMessage(data.error || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>User Signup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <select
              className="w-full border rounded p-2"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="admin">Administrator</option>
              <option value="viewer">Viewer</option>
              <option value="wl_viewer">Whitelist Viewer</option>
            </select>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
            {message && <div className="text-center text-sm mt-2">{message}</div>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}