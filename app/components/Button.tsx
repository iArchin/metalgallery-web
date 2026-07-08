import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "text" | "accent";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer rounded-full active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  const variantStyles = {
    primary:
      "bg-primary text-primary-content shadow-sm shadow-primary/30 hover:bg-primary-hover",
    secondary:
      "bg-surface text-content border border-border hover:bg-surface-2 hover:border-border-strong",
    outline:
      "bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-primary-content",
    text: "bg-transparent text-content hover:text-primary",
    accent:
      "bg-primary-soft text-primary hover:bg-primary hover:text-primary-content",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
  };

  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none hover:translate-y-0"
    : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
