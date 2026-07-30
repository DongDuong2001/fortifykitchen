"use client";

import React, { useState } from "react";

interface AddToCartButtonProps {
  text: string;
  onClick: (e: React.MouseEvent<React.ElementRef<"button">>) => void;
  className?: string;
  disabled?: boolean;
  imageUrl?: string;
}

export default function AddToCartButton({
  text,
  onClick,
  className = "",
  disabled = false,
  imageUrl,
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);

  const handleClick = (e: React.MouseEvent<React.ElementRef<"button">>) => {
    setIsAdded(true);

    // Dynamic Fly to Cart Animation
    try {
      const btnElement = e.currentTarget;
      const btnRect = btnElement.getBoundingClientRect();
      const cartBtn = document.getElementById("header-cart-btn");

      if (cartBtn) {
        const cartRect = cartBtn.getBoundingClientRect();
        const flyingBadge = document.createElement("div");

        flyingBadge.style.position = "fixed";
        flyingBadge.style.left = `${btnRect.left + btnRect.width / 2 - 24}px`;
        flyingBadge.style.top = `${btnRect.top + btnRect.height / 2 - 24}px`;
        flyingBadge.style.width = "48px";
        flyingBadge.style.height = "48px";
        flyingBadge.style.borderRadius = "9999px";
        flyingBadge.style.border = "2px solid #3aa856";
        flyingBadge.style.backgroundColor = "#ffffff";
        flyingBadge.style.boxShadow = "0 10px 25px rgba(58, 168, 86, 0.4)";
        flyingBadge.style.overflow = "hidden";
        flyingBadge.style.zIndex = "99999";
        flyingBadge.style.pointerEvents = "none";
        flyingBadge.style.transition = "all 0.75s cubic-bezier(0.18, 0.89, 0.32, 1.28)";
        flyingBadge.style.transform = "scale(1)";
        flyingBadge.style.opacity = "1";
        flyingBadge.style.display = "flex";
        flyingBadge.style.alignItems = "center";
        flyingBadge.style.justifyContent = "center";

        if (imageUrl) {
          const img = document.createElement("img");
          img.src = imageUrl;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";
          flyingBadge.appendChild(img);
        } else {
          flyingBadge.innerHTML = `<span style="font-weight:900; color:#3aa856; font-size:16px;">+1</span>`;
        }

        document.body.appendChild(flyingBadge);

        // Force browser layout update
        void flyingBadge.offsetWidth;

        // Animate flying thumbnail toward target header cart button
        flyingBadge.style.left = `${cartRect.left + cartRect.width / 2 - 12}px`;
        flyingBadge.style.top = `${cartRect.top + cartRect.height / 2 - 12}px`;
        flyingBadge.style.width = "24px";
        flyingBadge.style.height = "24px";
        flyingBadge.style.transform = "scale(0.3) rotate(360deg)";
        flyingBadge.style.opacity = "0.7";

        setTimeout(() => {
          if (flyingBadge.parentNode) {
            flyingBadge.parentNode.removeChild(flyingBadge);
          }
          // Bounce target cart icon
          cartBtn.classList.add("scale-125", "text-primary");
          setTimeout(() => {
            cartBtn.classList.remove("scale-125", "text-primary");
          }, 300);
        }, 750);
      }
    } catch {
      // Ignore animation errors gracefully
    }

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
