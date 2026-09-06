import React from "react";

/**
 * The BhashaBot mark: two brackets around a single point — a message going out
 * and a message coming back. Same geometry as app/icon.svg, but it inherits the
 * surrounding colours instead of the favicon's fixed ones.
 */
export default function Logo({
  size = 32,
  className,
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="32" height="32" rx="8" className="fill-panelCard" />
      <path
        d="M12.5 9.5 L7 16 L12.5 22.5"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-signal"
      />
      <path
        d="M19.5 9.5 L25 16 L19.5 22.5"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-mint"
      />
      <circle cx="16" cy="16" r="1.7" className="fill-paper" />
    </svg>
  );
}
