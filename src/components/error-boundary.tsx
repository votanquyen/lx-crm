/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default error fallback UI
 */
function ErrorFallback({ error, onReset }: { error: Error | null; onReset?: () => void }) {
  return (
    <Card className="border-destructive">
      <CardHeader className="pb-2">
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Đã xảy ra lỗi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Một lỗi không mong muốn đã xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi tiếp tục.
        </p>
        {process.env.NODE_ENV === "development" && error && (
          <pre className="bg-muted max-h-32 overflow-auto rounded-md p-3 text-xs">
            {error.message}
          </pre>
        )}
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Error Boundary class component
 * Wraps children and catches runtime errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
