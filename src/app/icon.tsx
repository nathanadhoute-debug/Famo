import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="8" fill="#3A6B5E" />
        <path
          d="M14 21c-.35 0-.7-.13-.96-.37C9.9 17.4 7.75 15.4 7.75 13 7.75 11.07 9.3 9.5 11.2 9.5c1.04 0 2.04.5 2.8 1.3.76-.8 1.76-1.3 2.8-1.3 1.9 0 3.45 1.57 3.45 3.5 0 2.4-2.15 4.4-5.29 7.13-.26.24-.6.37-.96.37z"
          fill="#fff"
        />
      </svg>
    ),
    { ...size }
  );
}
