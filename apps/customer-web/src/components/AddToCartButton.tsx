"use client";

import React, { useState } from "react";

interface AddToCartButtonProps {
  text: string;
  onClick: (e: React.MouseEvent<React.ElementRef<"button">>) => void;
  className?: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  text,
  onClick,
  className = "",
  disabled = false,
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);

  const handleClick = (e: React.MouseEvent<React.ElementRef<"button">>) => {
    setIsAdded(true);
    onClick(e);
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`btn-add-cart ${isAdded ? "btn-add-cart-added" : ""} ${className}`}
    >
      <span className="button__text">{isAdded ? "Đã thêm!" : text}</span>
      <span className="button__icon">
        {isAdded ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="svg animate-bounce-short"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
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
        )}
      </span>
    </button>
  );
}
