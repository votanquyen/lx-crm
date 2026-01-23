"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { searchPlantTypesForAutocomplete } from "@/actions/plant-types";

interface PlantSuggestion {
  id: string;
  code: string;
  name: string;
  category: string | null;
  sizeSpec: string | null;
  unitPrice: number;
}

interface PlantAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectPlant?: (plant: PlantSuggestion) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Autocomplete input for plant names
 * Fetches suggestions from PlantType table as user types
 */
export function PlantAutocompleteInput({
  value,
  onChange,
  onSelectPlant,
  onBlur,
  onKeyDown,
  autoFocus = false,
  className,
}: PlantAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<PlantSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when value changes
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchPlantTypesForAutocomplete(query, 10);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      onKeyDown?.(e);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        } else {
          setIsOpen(false);
          onKeyDown?.(e);
        }
        break;
      case "Escape":
        setIsOpen(false);
        onKeyDown?.(e);
        break;
      case "Tab":
        setIsOpen(false);
        onKeyDown?.(e);
        break;
      default:
        onKeyDown?.(e);
    }
  };

  // Handle selection
  const handleSelect = (plant: PlantSuggestion) => {
    onChange(plant.name);
    onSelectPlant?.(plant);
    setIsOpen(false);
    setSuggestions([]);
  };

  // Handle blur
  const handleBlur = () => {
    // Delay to allow click on dropdown
    setTimeout(() => {
      setIsOpen(false);
      onBlur?.();
    }, 150);
  };

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce<Record<string, PlantSuggestion[]>>((acc, plant) => {
    const cat = plant.category || "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(plant);
    return acc;
  }, {});

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => value.length >= 2 && setSuggestions.length > 0 && setIsOpen(true)}
        autoFocus={autoFocus}
        className={cn("h-7 min-w-[180px] px-1 text-sm", className)}
        placeholder="Nhập tên cây…"
        aria-label="Tìm kiếm tên cây"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        role="combobox"
      />

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 z-50 mt-1 max-h-[280px] w-[320px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
          role="listbox"
        >
          {isLoading ? (
            <div className="p-3 text-center text-sm text-slate-500">Đang tìm…</div>
          ) : (
            Object.entries(groupedSuggestions).map(([category, plants]) => (
              <div key={category}>
                <div className="sticky top-0 bg-slate-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {category}
                </div>
                {plants.map((plant) => {
                  const globalIdx = suggestions.indexOf(plant);
                  return (
                    <button
                      key={plant.id}
                      type="button"
                      role="option"
                      aria-selected={globalIdx === highlightedIndex}
                      className={cn(
                        "hover:bg-primary/5 w-full px-3 py-2 text-left transition-colors",
                        "flex items-center justify-between gap-2",
                        globalIdx === highlightedIndex && "bg-primary/10"
                      )}
                      onClick={() => handleSelect(plant)}
                      onMouseEnter={() => setHighlightedIndex(globalIdx)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">
                          {plant.name}
                        </div>
                        {plant.sizeSpec && (
                          <div className="text-xs text-slate-500">{plant.sizeSpec}</div>
                        )}
                      </div>
                      <div className="text-primary text-xs font-bold whitespace-nowrap">
                        {formatCurrency(plant.unitPrice)}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
