"use client";
import styled from "styled-components";
import MisredTextIcon from "../custom/icons/misred-text";

export default function LoaderText() {
  return (
    <StyledWrapper>
      <MisredTextIcon className="loaderText" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .loaderText {
    width: 12em;
    height: 12em;
  }

  .loaderText path {
    stroke: var(--primary);
    stroke-width: 4px;
    animation: dashArray 4s ease-in-out infinite;
  }

  @keyframes dashArray {
    0%,
    100% {
      stroke-dasharray: 0 1 359 0;
      stroke-dashoffset: 90;
      fill: var(--background);
    }

    50% {
      stroke-dasharray: 0 359 1 0;
      stroke-dashoffset: 180;
      fill: var(--primary);
    }
  }
`;
