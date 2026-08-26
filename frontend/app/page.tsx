"use client";

import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, Lock, Search, Download, TrendingUp, Home, DollarSign } from "lucide-react";

export default function EconomicDashboard() {
  // --- AUTH STATES ---
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // --- APP STATES ---
  const [indicator, setIndicator] = useState("VNQ"); // VNQ = Real Estate, TIP = Inflation
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any>(null);

  // --- HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // FastAPI OAuth2 expects form data, not JSON
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
      } else {
        alert("Invalid credentials. Try again.");
      }
    } catch (error) {
      alert("Could not connect to the backend. Is Python running?");
    }
  };

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // JWT Security
        },
        body: JSON.stringify({ indicator, forecast_months: months })
      });

      if (res.ok) {
        const data = await res.json();
        setForecastData(data);
      } else {
        alert("Error fetching forecast.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!forecastData) return;
    const headers = "Date,Predicted_Value\n";
    const csv = forecastData.forecast.map((row: any) => `${row.date},${row.predicted_value}`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicator}_Forecast_Report.csv`;
    a.click();
  };

  // --- RENDER LOGIN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans text-slate-900">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm border border-slate-200">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-full text-indigo-700">
              <Lock size={28} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">EconoMetrics Pro</h1>
          <p className="text-sm text-center text-slate-500 mb-6">Secure Intelligence Platform</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Company Username</label>
              <input 
                type="text" required 
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                value={username} onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Password</label>
              <input 
                type="password" required 
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-md hover:bg-indigo-700 transition">
              Secure Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <header className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={32} />
            EconoMetrics Forecaster
          </h1>
          <p className="text-slate-500 mt-1">Inflation & Housing Market Predictive Analytics</p>
        </div>
        <button onClick={() => setToken(null)} className="text-sm text-slate-500 hover:text-slate-800 underline">
          Sign Out ({username})
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* FILTERING & SEARCH PANEL */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit lg:col-span-1">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Search size={18}/> Search Parameters</h2>
          <form onSubmit={handleForecast} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1">Macro Indicator</label>
              <select 
                className="w-full p-2 border rounded-md bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={indicator} onChange={(e) => setIndicator(e.target.value)}
              >
                <option value="VNQ">U.S. Real Estate (VNQ)</option>
                <option value="TIP">Treasury Inflation-Protected (TIP)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Forecast Horizon (Months)</label>
              <input 
                type="number" min="1" max="24" required
                className="w-full p-2 border rounded-md bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={months} onChange={(e) => setMonths(Number(e.target.value))}
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-2 rounded-md hover:bg-indigo-700 transition flex justify-center items-center gap-2"
            >
              {loading ? "Processing ML..." : "Run Forecast Model"}
            </button>
          </form>
        </div>

        {/* ANALYTICS DASHBOARD */}
        <div className="lg:col-span-3 space-y-6">
          {forecastData ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${indicator === 'VNQ' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    {indicator === 'VNQ' ? <Home size={28}/> : <DollarSign size={28}/>}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold">Current Index Value ({indicator})</p>
                    <p className="text-2xl font-black">${forecastData.current_value}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                    <TrendingUp size={28}/>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold">AI Trend Analysis</p>
                    <p className="text-sm text-slate-700 mt-1 leading-snug">{forecastData.analysis}</p>
                  </div>
                </div>
              </div>

              {/* CHART & REPORT EXPORT */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">{months}-Month Forward Projection</h3>
                  <button 
                    onClick={exportReport}
                    className="flex items-center gap-2 text-sm bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition"
                  >
                    <Download size={16} /> Export CSV Report
                  </button>
                </div>
                
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData.forecast} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <Line type="monotone" dataKey="predicted_value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Predicted Index"]} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white h-full min-h-[400px] rounded-xl shadow-sm border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
              <BarChart3 size={48} className="mb-4 opacity-50" />
              <p>Configure search parameters to generate intelligence report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}