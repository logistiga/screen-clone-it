import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { searchDescriptions } from "@/lib/api/descriptions";
import { cn } from "@/lib/utils";

interface DescriptionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  /** 'lot' | 'conteneur' | 'all' */
  type?: 'lot' | 'conteneur' | 'all';
}

export function DescriptionAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder = "Description de la marchandise",
  className,
  type = 'all',
}: DescriptionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    try {
      const results = await searchDescriptions(query, type);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                idx === highlightedIndex && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
