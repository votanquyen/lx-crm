"use client";

/**
 * Masked input for API keys
 * Shows masked value when not editing, reveals on focus
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { maskValue } from "@/lib/mask-value";

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ApiKeyInput({ value, onChange, placeholder }: ApiKeyInputProps) {
  const [showValue, setShowValue] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Show masked value if not editing
  const displayValue = isEditing ? value : value.includes("****") ? value : maskValue(value);

  const handleFocus = () => {
    setIsEditing(true);
    // Clear masked value on focus if it contains asterisks
    if (value.includes("****")) {
      onChange("");
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    setShowValue(false);
  };

  return (
    <div className="relative">
      <Input
        type={showValue ? "text" : "password"}
        value={isEditing ? value : displayValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="pr-10"
        autoComplete="off"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full"
        onClick={() => setShowValue(!showValue)}
        tabIndex={-1}
        aria-label={showValue ? "Ẩn API key" : "Hiện API key"}
      >
        {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
