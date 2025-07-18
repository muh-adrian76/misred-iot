import React from 'react';
import styled from 'styled-components';

const CustomSwitch = () => {
  return (
    <StyledWrapper>
      <label className="switch">
        <input type="checkbox" className="checkbox" />
        <div className="slider" />
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .checkbox {
    display: none;
  }

  .slider {
    width: 60px;
    height: 30px;
    background-color: lightgray;
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    align-items: center;
    border: 4px solid transparent;
    transition: .3s;
    box-shadow: 0 0 10px 0 rgb(0, 0, 0, 0.25) inset;
    cursor: pointer;
  }

  .slider::before {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    background-color: #fff;
    transform: translateX(-30px);
    border-radius: 20px;
    transition: .3s;
    box-shadow: 0 0 10px 3px rgb(0, 0, 0, 0.25);
  }

  .checkbox:checked ~ .slider::before {
    transform: translateX(30px);
    box-shadow: 0 0 10px 3px rgb(0, 0, 0, 0.25);
  }

  .checkbox:checked ~ .slider {
    background-color: #2196F3;
  }

  .checkbox:active ~ .slider::before {
    transform: translate(0);
  }`;

export default CustomSwitch;
