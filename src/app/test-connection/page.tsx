"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function ConnectionTest() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);

  const testConnection = async () => {
    setStatus("loading");
    setMessage("Testing connection...");

    try {
      // Use fetch to avoid axios interceptor
      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") +
          "/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test", password: "test" }),
        }
      );

      const data = await response.json();

      // 401 or 400 means endpoint is working!
      if (response.status === 401 || response.status === 400) {
        setStatus("success");
        setMessage("✅ Backend is connected and working!");
        setDetails({
          status: response.status,
          message:
            "Auth endpoint rejected invalid credentials (correct behavior)",
          response: data,
        });
      } else {
        setStatus("success");
        setMessage("✅ Backend responding");
        setDetails({ status: response.status, data });
      }
    } catch (error) {
      setStatus("error");
      const err = error as Error;
      setMessage("❌ Cannot connect to backend");
      setDetails({
        error: err.message,
        url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
        suggestion: "Make sure backend is running on port 5000",
      });
    }
  };

  const testAuth = async () => {
    setStatus("loading");
    setMessage("Testing auth endpoint...");

    try {
      // Test with dummy credentials (should return 401 or proper error)
      const response = await api.post("/auth/login", {
        email: "test@test.com",
        password: "test123",
      });

      setStatus("success");
      setMessage("Auth endpoint responding (unexpected success)");
      setDetails(response.data);
    } catch (error) {
      const err = error as { response?: { status?: number; data?: unknown } };

      // 401 or 400 is actually good - means endpoint is working
      if (err.response?.status === 401 || err.response?.status === 400) {
        setStatus("success");
        setMessage("✅ Auth endpoint is working!");
        setDetails({
          status: err.response.status,
          message: "Endpoint rejected invalid credentials (correct behavior)",
          data: err.response.data,
        });
      } else {
        setStatus("error");
        setMessage("❌ Auth endpoint error");
        setDetails({
          error: err.response?.data || "Unknown error",
          status: err.response?.status,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Backend Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={status === "loading"}>
              {status === "loading" ? "Testing..." : "Test Backend Connection"}
            </Button>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                status === "loading"
                  ? "bg-blue-50 text-blue-700"
                  : status === "success"
                  ? "bg-green-50 text-green-700"
                  : status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              <p className="font-medium">{message}</p>
            </div>
          )}

          {details && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Details:</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}

          <div className="border-t pt-4 mt-4 text-sm text-gray-600">
            <p>
              <strong>Current API URL:</strong>
            </p>
            <code className="bg-gray-100 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
