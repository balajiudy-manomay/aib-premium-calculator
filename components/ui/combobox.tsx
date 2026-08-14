"use client";

import * as React from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxContextType {
  value: any;
  onValueChange?: (value: any) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  items: any[];
  filteredItems: any[];
  itemToStringValue: (item: any) => string;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  selectItem: (item: any) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  showClear?: boolean;
}

const ComboboxContext = React.createContext<ComboboxContextType | null>(null);

function useComboboxContext() {
  const context = React.useContext(ComboboxContext);
  if (!context) {
    throw new Error("Combobox components must be wrapped in a <Combobox />");
  }
  return context;
}

interface ComboboxProps {
  children: React.ReactNode;
  items: any[];
  value?: any;
  onValueChange?: (value: any) => void;
  itemToStringValue?: (item: any) => string;
  showClear?: boolean;
  className?: string;
}

export function Combobox({
  children,
  items,
  value,
  onValueChange,
  itemToStringValue = (item) => (item ? String(item) : ""),
  showClear = false,
  className,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Sync inputValue with external value change when not open
  React.useEffect(() => {
    if (!isOpen) {
      setInputValue(itemToStringValue(value));
    }
  }, [value, isOpen, itemToStringValue]);

  const filteredItems = React.useMemo(() => {
    if (!inputValue) return items;
    const query = inputValue.toLowerCase().trim();
    return items.filter((item) =>
      itemToStringValue(item).toLowerCase().includes(query)
    );
  }, [items, inputValue, itemToStringValue]);

  // Reset focused index when filtered items change or dropdown opens
  React.useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredItems, isOpen]);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectItem = React.useCallback(
    (item: any) => {
      onValueChange?.(item);
      setInputValue(itemToStringValue(item));
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onValueChange, itemToStringValue]
  );

  return (
    <ComboboxContext.Provider
      value={{
        value,
        onValueChange,
        inputValue,
        setInputValue,
        isOpen,
        setIsOpen,
        items,
        filteredItems,
        itemToStringValue,
        focusedIndex,
        setFocusedIndex,
        selectItem,
        inputRef,
        listRef,
        showClear,
      }}
    >
      <div
        ref={containerRef}
        className={cn("relative w-full", className)}
      >
        {children}
      </div>
    </ComboboxContext.Provider>
  );
}

interface ComboboxInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {}

export function ComboboxInput({
  placeholder,
  className,
  ...props
}: ComboboxInputProps) {
  const {
    inputValue,
    setInputValue,
    isOpen,
    setIsOpen,
    filteredItems,
    focusedIndex,
    setFocusedIndex,
    selectItem,
    inputRef,
    showClear,
    value,
    onValueChange,
  } = useComboboxContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(
          focusedIndex < filteredItems.length - 1 ? focusedIndex + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(
          focusedIndex > 0 ? focusedIndex - 1 : filteredItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredItems.length) {
          selectItem(filteredItems[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    onValueChange?.("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full pl-4 pr-10 py-2.5 text-sm font-semibold rounded-xl bg-slate-50 border border-slate-200 text-brand-charcoal outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 transition-all",
          className
        )}
        {...props}
      />
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
        {showClear && inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="hover:text-slate-600 transition p-0.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200 cursor-pointer hover:text-slate-600",
            isOpen && "rotate-185"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
        />
      </div>
    </div>
  );
}

interface ComboboxContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ComboboxContent({ children, className }: ComboboxContentProps) {
  const { isOpen } = useComboboxContext();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute z-50 w-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ComboboxEmptyProps {
  children: React.ReactNode;
  className?: string;
}

export function ComboboxEmpty({ children, className }: ComboboxEmptyProps) {
  const { filteredItems } = useComboboxContext();

  if (filteredItems.length > 0) return null;

  return (
    <div className={cn("px-4 py-3 text-xs font-semibold text-slate-400 select-none text-center", className)}>
      {children}
    </div>
  );
}

interface ComboboxListProps {
  children: (item: any) => React.ReactNode;
  className?: string;
}

export function ComboboxList({ children, className }: ComboboxListProps) {
  const { filteredItems, listRef } = useComboboxContext();

  // Scroll active item into view
  React.useEffect(() => {
    const activeEl = listRef.current?.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [listRef]);

  if (filteredItems.length === 0) return null;

  return (
    <div
      ref={listRef}
      className={cn("overflow-y-auto py-1 flex-1 max-h-56 scrollbar-thin scrollbar-thumb-slate-200", className)}
    >
      {filteredItems.map((item, index) => {
        // Inject index info into ComboboxItem contextually via custom property or item attributes
        return (
          <ComboboxItemIndexContext.Provider key={index} value={index}>
            {children(item)}
          </ComboboxItemIndexContext.Provider>
        );
      })}
    </div>
  );
}

const ComboboxItemIndexContext = React.createContext<number | null>(null);

interface ComboboxItemProps {
  children: React.ReactNode;
  value: any;
  className?: string;
}

export function ComboboxItem({ children, value: itemVal, className }: ComboboxItemProps) {
  const { value, selectItem, focusedIndex, setFocusedIndex, itemToStringValue } = useComboboxContext();
  const index = React.useContext(ComboboxItemIndexContext);
  
  if (index === null) {
    throw new Error("ComboboxItem must be rendered within a ComboboxList render function");
  }

  const isSelected = itemToStringValue(value) === itemToStringValue(itemVal);
  const isActive = focusedIndex === index;

  return (
    <div
      onClick={() => selectItem(itemVal)}
      onMouseEnter={() => setFocusedIndex(index)}
      data-active={isActive}
      className={cn(
        "px-4 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer transition select-none",
        isActive ? "bg-brand-blue/10 text-brand-indigo font-bold" : "text-brand-charcoal",
        isSelected && "bg-brand-blue/5 font-extrabold text-brand-indigo",
        className
      )}
    >
      <span>{children}</span>
      {isSelected && <Check className="w-3.5 h-3.5 text-brand-blue shrink-0" />}
    </div>
  );
}
