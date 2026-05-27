import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = "primary", size = "default", children, ...props }, ref) => {
  const variants = {
    primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90 shadow-md",
    secondary: "bg-white/10 text-white hover:bg-white/20",
    danger: "bg-red-500/90 text-white hover:bg-red-500 shadow-md",
    outline: "border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10",
    ghost: "hover:bg-white/10 text-[var(--color-text)] hover:text-white"
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-8 text-lg",
    icon: "h-10 w-10 flex items-center justify-center"
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
