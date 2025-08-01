// Menggunakan "use client" untuk komponen React sisi klien
"use client";
// Import utility untuk class names
import { cn } from "@/lib/utils";
// Import hooks React
import { useRef, useEffect } from "react";
// Import styled-components untuk styling kustom
import styled from "styled-components";

// Komponen checkbox button dengan styling kustom dan animasi
const CheckboxButton = ({
  id, // ID unik untuk checkbox
  text, // Teks label checkbox
  checked = false, // Status checked default
  onChange, // Handler untuk perubahan state
  indeterminate, // Status indeterminate (partially checked)
  disabled = false, // Status disabled
  ...props // Props tambahan yang akan diteruskan
}) => {
  // Ref untuk mengakses DOM element checkbox
  const ref = useRef();

  // Effect untuk mengatur indeterminate state
  useEffect(() => {
    if (ref.current) {
      // Set indeterminate property pada DOM element
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <StyledWrapper>
      <div className="checkbox-wrapper-46">
        {/* Input checkbox dengan ref dan props */}
        <input
          type="checkbox"
          id={id}
          className="inp-cbx"
          checked={checked}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        {/* Label dengan SVG checkmark dan teks */}
        <label htmlFor={id} className="cbx">
          <span>
            {/* SVG icon untuk checkmark */}
            <svg viewBox="0 0 12 10" height="10px" width="12px">
              <polyline points="1.5 6 4.5 9 10.5 1" />
            </svg>
          </span>
          {/* Teks label dengan conditional styling */}
          <span className={cn(
            "max-sm:text-sm", // Small text di mobile
            text ? "ml-2" : "", // Margin left jika ada teks
            disabled ? "text-muted-foreground line-through" : "" // Styling untuk disabled state
          )}>
            {text}
          </span>
        </label>
      </div>
    </StyledWrapper>
  );
};

// Styled wrapper dengan CSS kustom untuk animasi checkbox
const StyledWrapper = styled.div`
  .checkbox-wrapper-46 input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    z-index: 1;
    cursor: pointer;
  }

  .checkbox-wrapper-46 {
    position: relative;
  }

  .checkbox-wrapper-46 .cbx {
    margin: auto;
    -webkit-user-select: none;
    user-select: none;
    cursor: pointer;
  }

  .checkbox-wrapper-46 .cbx span {
    display: inline-block;
    vertical-align: middle;
    transform: translate3d(0, 0, 0);
  }
  .checkbox-wrapper-46 .cbx span:first-child {
    position: relative;
    width: 20px;
    margin-left: 7px;
    height: 20px;
    border-radius: 3px;
    transform: scale(1);
    vertical-align: middle;
    border: 1px solid #9098a9;
    transition: all 0.2s ease;
  }
  .checkbox-wrapper-46 .cbx span:first-child svg {
    position: absolute;
    top: 4px;
    left: 3px;
    fill: none;
    stroke: #ffffff;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 16px;
    stroke-dashoffset: 16px;
    transition: all 0.3s ease;
    transition-delay: 0.1s;
    transform: translate3d(0, 0, 0);
  }
  .checkbox-wrapper-46 .cbx span:first-child:before {
    content: "";
    width: 100%;
    height: 100%;
    background: var(--color-primary);
    display: block;
    transform: scale(0);
    opacity: 1;
    border-radius: 50%;
  }
  .checkbox-wrapper-46 .cbx span:last-child {
    padding-left: 8px;
  }
  .checkbox-wrapper-46 .cbx:hover span:first-child {
    border-color: var(--color-primary);
  }

  .checkbox-wrapper-46 .inp-cbx:checked + .cbx span:first-child {
    background: var(--color-primary);
    border-color: var(--color-primary);
    animation: wave-46 0.4s ease;
  }
  .checkbox-wrapper-46 .inp-cbx:checked + .cbx span:first-child svg {
    stroke-dashoffset: 0;
  }
  .checkbox-wrapper-46 .inp-cbx:checked + .cbx span:first-child:before {
    transform: scale(3.5);
    opacity: 0;
    transition: all 0.6s ease;
  }

  @keyframes wave-46 {
    50% {
      transform: scale(0.9);
    }
  }
`;

export default CheckboxButton;
