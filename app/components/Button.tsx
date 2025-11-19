import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "text";
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
  const baseStyles = "font-semibold transition-colors cursor-pointer rounded-lg";

  const variantStyles = {
    primary: "bg-teal-600 text-white hover:bg-teal-700",
    secondary: "bg-white text-gray-900 hover:bg-gray-100 border border-gray-300",
    outline: "bg-transparent text-gray-900 border-2 border-gray-300 hover:bg-gray-50",
    text: "bg-transparent text-gray-900 hover:text-teal-600",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabledStyles}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  );
}
