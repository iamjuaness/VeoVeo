import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

// A component that always throws an error
const ThrowError = ({ message = "Test error" }: { message?: string }) => {
  throw new Error(message);
};

// A component that renders normally
const NormalComponent = () => {
  return <div data-testid="normal">Normal Component</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Prevent React's error boundary logging from cluttering the test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("normal")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws an error", () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Crashed component" />
      </ErrorBoundary>,
    );

    // The fallback UI should contain the text "Vaya, algo salió mal"
    expect(screen.getByText("Vaya, algo salió mal")).toBeInTheDocument();
    // And the error message should be displayed
    expect(screen.getByText("Crashed component")).toBeInTheDocument();
  });

  it("renders a custom fallback if provided", () => {
    render(
      <ErrorBoundary
        fallback={<div data-testid="custom-fallback">Custom Fallback</div>}
      >
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
  });
});
