import { ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border border-forest-100 shadow-card",
        hover &&
          "transition-all duration-300 hover:-translate-y-1.5 hover:shadow-hover hover:border-forest-200 hover:scale-[1.01]",
        className
      )}
    >
      {children}
    </div>
  );
}
