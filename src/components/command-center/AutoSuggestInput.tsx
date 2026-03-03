import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";

interface AutoSuggestInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: string[];
  ghostColor?: string; // CSS color for ghost text
  onAcceptSuggestion?: (full: string) => void;
}

const AutoSuggestInput = forwardRef<HTMLInputElement, AutoSuggestInputProps>(
  ({ value, onChange, onKeyDown, suggestions, ghostColor = "currentColor", onAcceptSuggestion, className, style, ...rest }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const [ghost, setGhost] = useState("");

    // Find best matching suggestion
    useEffect(() => {
      if (!value || value.length < 2) {
        setGhost("");
        return;
      }
      const lower = value.toLowerCase();
      const match = suggestions.find((s) => s.toLowerCase().startsWith(lower) && s.toLowerCase() !== lower);
      setGhost(match ? match.slice(value.length) : "");
    }, [value, suggestions]);

    const acceptGhost = useCallback(() => {
      if (!ghost) return false;
      const full = value + ghost;
      // Create a synthetic change event
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value"
      )?.set;
      if (innerRef.current && nativeInputValueSetter) {
        nativeInputValueSetter.call(innerRef.current, full);
        const event = new Event("input", { bubbles: true });
        innerRef.current.dispatchEvent(event);
      }
      onAcceptSuggestion?.(full);
      setGhost("");
      return true;
    }, [ghost, value, onAcceptSuggestion]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (ghost) {
          if (e.key === "Tab") {
            e.preventDefault();
            acceptGhost();
            return;
          }
          if (e.key === "ArrowRight" && innerRef.current) {
            const pos = innerRef.current.selectionStart ?? 0;
            if (pos >= value.length) {
              e.preventDefault();
              acceptGhost();
              return;
            }
          }
        }
        onKeyDown?.(e);
      },
      [ghost, acceptGhost, onKeyDown, value.length]
    );

    return (
      <div className="relative flex-1" style={{ fontFamily: "inherit" }}>
        {/* Real input */}
        <input
          ref={innerRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className={className}
          style={style}
          autoComplete="off"
          {...rest}
        />
        {/* Ghost overlay */}
        {ghost && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center overflow-hidden"
            style={style}
            aria-hidden
          >
            {/* Invisible mirror of typed text to measure offset */}
            <span className="whitespace-pre invisible" style={{ fontSize: "inherit", fontFamily: "inherit", letterSpacing: "inherit" }}>
              {value}
            </span>
            {/* Ghost remainder */}
            <span
              className="whitespace-pre"
              style={{
                color: ghostColor,
                opacity: 0.22,
                fontSize: "inherit",
                fontFamily: "inherit",
                letterSpacing: "inherit",
              }}
            >
              {ghost}
            </span>
          </div>
        )}
      </div>
    );
  }
);

AutoSuggestInput.displayName = "AutoSuggestInput";

export default AutoSuggestInput;
