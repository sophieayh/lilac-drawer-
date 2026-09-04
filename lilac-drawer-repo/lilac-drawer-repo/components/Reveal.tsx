import { ReactNode } from "react";

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
}) {
  return (
    <div
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={`animate-fade-in-up ${className}`}
    >
      {children}
    </div>
  );
}
