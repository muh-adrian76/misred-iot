// Komponen client-side untuk animated text loader
"use client";

// Import styled-components untuk custom CSS animations
import styled from "styled-components";

// Import custom icon komponen untuk MiSREd text logo
import MisredTextIcon from "../custom/icons/misred-text";

/**
 * Komponen Loading dengan animasi SVG text
 * Menggunakan SVG path animation untuk efek loading yang menarik
 * @returns {JSX.Element} Animated loader dengan brand text
 */
export default function LoaderText() {
  return (
    <StyledWrapper>
      {/* Custom icon dengan class untuk styling */}
      <MisredTextIcon className="loaderText" />
    </StyledWrapper>
  );
};

// Styled wrapper dengan CSS animation untuk SVG paths
const StyledWrapper = styled.div`
  /* Container untuk loader text */
  .loaderText {
    width: 12em; /* Ukuran responsif dengan em unit */
    height: 12em;
  }

  /* Styling untuk SVG path elements */
  .loaderText path {
    stroke: var(--primary); /* Menggunakan CSS variable untuk theming */
    stroke-width: 4px; /* Ketebalan stroke */
    animation: dashArray 4s ease-in-out infinite; /* Animasi infinite loop */
  }

  /* Keyframes untuk animasi dash array - efek drawing/loading */
  @keyframes dashArray {
    /* State awal dan akhir - stroke tidak terlihat, background transparan */
    0%,
    100% {
      stroke-dasharray: 0 1 359 0; /* Pattern dash: tidak ada dash di awal */
      stroke-dashoffset: 90; /* Offset untuk posisi starting */
      fill: var(--background); /* Background color dari theme */
    }

    /* State tengah - stroke penuh terlihat, fill dengan primary color */
    50% {
      stroke-dasharray: 0 359 1 0; /* Pattern dash: full stroke terlihat */
      stroke-dashoffset: 180; /* Offset untuk smooth transition */
      fill: var(--primary); /* Primary color dari theme untuk filled state */
    }
  }
`;
