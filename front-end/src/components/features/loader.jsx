import React from 'react';
import styled from 'styled-components';
import { MisredIcon } from '../icons/misred';

const Loader = () => {
  return (
    <StyledWrapper>
      <MisredIcon className="loader"></MisredIcon>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
      width: 12em;
      height: 12em;
    }

    .loader path {
      stroke: #41A2BF;
      stroke-width: 4px;
      animation: dashArray 4s ease-in-out infinite,
        dashOffset 4s ease infinite;
    }

    @keyframes dashArray {
      0%, 100% {
        stroke-dasharray: 0 1 359 0;
        fill: #F0F0F0;
      }

      50% {
        stroke-dasharray: 0 359 1 0;
        fill: #41A2BF; 
      }
    }

    @keyframes dashOffset {
      0%, 100% {
        stroke-dashoffset: 180;
      }

      50% {
        stroke-dashoffset: 90;
      }
    }`;

export default Loader;
