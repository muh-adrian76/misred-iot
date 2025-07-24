"use client";

import { useState } from "react";

export default function AdminUsersDebug() {
  const [debugInfo, setDebugInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const testEndpoint = async () => {
    setLoading(true);
    setDebugInfo("");
    
    try {
      console.log("🧪 Testing /admin/users endpoint...");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      console.log("📡 Response:", response);
      
      let info = `Status: ${response.status} ${response.statusText}\n`;
      info += `OK: ${response.ok}\n`;
      info += `Headers: ${JSON.stringify([...response.headers.entries()], null, 2)}\n\n`;
      
      if (response.ok) {
        const data = await response.json();
        info += `Response Data:\n${JSON.stringify(data, null, 2)}`;
      } else {
        const errorText = await response.text();
        info += `Error Response:\n${errorText}`;
      }
      
      setDebugInfo(info);
    } catch (error) {
      console.error("💥 Error:", error);
      setDebugInfo(`Error: ${error.message}\n${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setDebugInfo("");
    
    try {
      console.log("🔐 Testing auth token...");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      let info = `Auth Status: ${response.status} ${response.statusText}\n`;
      
      if (response.ok) {
        const data = await response.json();
        info += `Auth Data:\n${JSON.stringify(data, null, 2)}`;
      } else {
        const errorText = await response.text();
        info += `Auth Error:\n${errorText}`;
      }
      
      setDebugInfo(info);
    } catch (error) {
      console.error("💥 Error:", error);
      setDebugInfo(`Error: ${error.message}\n${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Admin Users - Debug Tool</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Endpoints</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={testAuth}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Test Auth
          </button>
          <button
            onClick={testEndpoint}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            Test Admin Users Endpoint
          </button>
        </div>
        
        {loading && (
          <div className="text-blue-600">Loading...</div>
        )}
      </div>

      {debugInfo && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-white">Debug Output:</h3>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h3 className="text-lg font-semibold mb-2">Environment Variables:</h3>
        <pre className="text-sm bg-gray-100 p-2 rounded">
{`NEXT_PUBLIC_BACKEND_URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}
Current URL: ${typeof window !== 'undefined' ? window.location.origin : 'SSR'}`}
        </pre>
      </div>
    </div>
  );
}
