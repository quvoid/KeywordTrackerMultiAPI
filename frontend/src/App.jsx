import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [domain, setDomain] = useState("");
  const [keywords, setKeywords] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [apiKeys, setApiKeys] = useState({
    serper: "",
    serpapi: "",
    serpstack: "",
    zenserp: ""
  });

  const [useScrapingRobot, setUseScrapingRobot] = useState(false);
  const [scrapingRobotKey, setScrapingRobotKey] = useState("f0badedd-eddc-43ec-aa4c-762a8ade1fd6");

  const handleApiKey = (key, value) =>
    setApiKeys((prev) => ({ ...prev, [key]: value }));

  const copyToClipboard = () => {
    if (!results.length) return;
    const text = results.map(r => `${r.keyword}\t${r.rank}`).join('\n');
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard! Ready to paste into Sheets/Excel.");
  };

  const runTracker = async () => {
    setError("");

    // --- Frontend validation ---
    if (!domain.trim()) {
      alert("Please enter a domain.");
      return;
    }

    const keywordList = keywords
      .split("\n")
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywordList.length === 0) {
      alert("Please enter at least one keyword.");
      return;
    }

    const payload = {
      domain: domain.trim(),
      keywords: keywordList,
      api_keys: {
        serper:    apiKeys.serper    || "",
        serpapi:   apiKeys.serpapi   || "",
        serpstack: apiKeys.serpstack || "",
        zenserp:   apiKeys.zenserp  || ""
      },
      useScrapingRobot,
      scrapingRobotKey: useScrapingRobot ? scrapingRobotKey.trim() : ""
    };

    console.log("[Payload]", payload);

    setLoading(true);
    setResults([]);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.post(
        `${BASE_URL}/tracker/run-direct`,
        payload
      );
      setResults(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRankClass = (rank) => {
    if (rank === "error" || rank === "Not Found") return "rank-error";
    const n = Number(rank);
    if (!isNaN(n)) {
      if (n <= 10) return "rank-top";
      if (n <= 30) return "rank-mid";
      return "rank-low";
    }
    return "rank-error";
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ padding: "0 20px" }}>
        <span className="team-label">SCHBANG SEO TEAM</span>
        <h1 className="main-title">
          <span className="title-white">Keyword</span>
          <br/>
          <span className="title-neon">Position</span>
          <br/>
          <span className="title-white">Tracker</span>
        </h1>
        <p className="subtitle">
          Enter your domain, keywords, and API keys to instantly detect real-time SEO rankings across engines — without touching your original sheets.
        </p>
      </div>

      <div className="tracker-card">
        <div className="form-body">
          {/* Domain */}
          <div className="form-group">
            <label>Domain</label>
            <input
              className="form-input"
              placeholder="e.g. example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>

          {/* Keywords */}
          <div className="form-group">
            <label>Keywords <span className="label-hint">(one per line)</span></label>
            <textarea
              className="form-input form-textarea"
              rows={7}
              placeholder={"seo tools\nbest keyword tracker\n..."}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          {/* API Keys */}
          <div className="form-group">
            <label>API Keys <span className="label-hint">(leave blank to skip)</span></label>
            <div className="api-grid">
              {[
                { key: "serper",    label: "Serper" },
                { key: "serpapi",   label: "SearchAPI" },
                { key: "serpstack", label: "SerpStack" },
                { key: "zenserp",  label: "Zenserp" }
              ].map(({ key, label }) => (
                <input
                  key={key}
                  className="form-input api-input"
                  placeholder={label}
                  value={apiKeys[key]}
                  onChange={(e) => handleApiKey(key, e.target.value)}
                />
              ))}
            </div>
          </div>

          {/* ScrapingRobot Section */}
          <div className="form-group scraping-robot-section" style={{ marginTop: '10px', padding: '16px', borderRadius: '12px', border: '1px solid rgba(212, 255, 0, 0.2)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
              <input 
                type="checkbox" 
                checked={useScrapingRobot} 
                onChange={(e) => setUseScrapingRobot(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: '#d4ff00' }} 
              />
              <span className="robot-label-text">Use ScrapingRobot (Deep Search Google UI)</span>
            </label>
            
            {useScrapingRobot && (
              <input
                className="form-input"
                placeholder="ScrapingRobot API Key"
                value={scrapingRobotKey}
                onChange={(e) => setScrapingRobotKey(e.target.value)}
              />
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          {/* Run Button */}
          <button
            className={`run-btn${loading ? " run-btn--loading" : ""}`}
            onClick={runTracker}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Running…
              </>
            ) : (
              "Sign in to get started"
            )}
          </button>
        </div> {/* End of form-body */}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="results-section">
            <div className="results-header-row">
              <h2 className="results-title">Results</h2>
              <button onClick={copyToClipboard} className="copy-button">
                📋 Copy to Sheets
              </button>
            </div>
            
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Keyword</th>
                  <th style={{ textAlign: "right" }}>Rank</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="row-num" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td className="row-keyword">
                      {r.keyword}
                      {r.detail && (
                        <div className="row-detail">{r.detail}</div>
                      )}
                    </td>
                    <td className="row-rank">
                      <span className={`rank-badge ${getRankClass(r.rank)}`}>
                        {r.rank}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div> {/* End of tracker-card */}
    </div>
  );
}