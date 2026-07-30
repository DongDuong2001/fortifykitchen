import React from "react";

interface AddToCartButtonProps {
  text: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  text,
  onClick,
  className = "",
  disabled = false,
}: AddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-add-cart ${className}`}
    >
      <span className="button__text">{text}</span>
      <span className="button__icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          className="svg"
        >
          <line y2={19} y1={5} x2={12} x1={12} />
          <line y2={12} y1={12} x2={19} x1={5} />
        </svg>
      </span>
    </button>
  );
}
