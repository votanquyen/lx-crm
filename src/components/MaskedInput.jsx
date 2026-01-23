import React, { useState } from "react";

const MaskedInput = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(""); // State to hold the API key value

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const handleInputChange = (event) => {
    setApiKey(event.target.value);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label htmlFor="apiKeyInput">API Key:</label>
      <input
        id="apiKeyInput"
        type={showApiKey ? "text" : "password"}
        value={apiKey}
        onChange={handleInputChange}
        placeholder="Enter your API key"
        style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
      />
      <button
        onClick={toggleApiKeyVisibility}
        style={{
          padding: "8px 12px",
          borderRadius: "4px",
          border: "1px solid #007bff",
          backgroundColor: "#007bff",
          color: "white",
          cursor: "pointer",
        }}
      >
        {showApiKey ? "Hide" : "Show"}
      </button>
    </div>
  );
};

export default MaskedInput;
