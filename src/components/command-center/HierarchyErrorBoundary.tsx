import React from "react";
import { getDefaultHierarchyContext } from "@/lib/intent/types";
import type { HierarchyContext } from "@/lib/intent/types";

interface HierarchyErrorBoundaryProps {
  children: React.ReactNode;
  fallbackContext: HierarchyContext;
  onReset: () => void;
}

interface State {
  hasError: boolean;
}

export class HierarchyErrorBoundary extends React.Component<HierarchyErrorBoundaryProps, State> {
  constructor(props: HierarchyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("HierarchyControls error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90"
          role="alert"
        >
          <p className="font-medium">Filter niet beschikbaar</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
            className="mt-1 text-amber-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Reset naar Algemeen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const defaultHierarchyFallback = getDefaultHierarchyContext();
