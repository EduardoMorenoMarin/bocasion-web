import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ className, variant = "default", children, ...props }) {
  const variants = {
    default: "bg-white/10 text-white",
    success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/20 text-red-400 border-red-500/20",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/20"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
