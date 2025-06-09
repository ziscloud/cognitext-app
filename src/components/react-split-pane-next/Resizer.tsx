import React, { Component } from 'react';
import styled from 'styled-components';

// 定义组件props类型
interface ResizerProps {
  index: number;
  split?: 'vertical' | 'horizontal';
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onMouseDown?: (event: React.MouseEvent, index: number) => void;
  onTouchEnd?: (event: React.TouchEvent, index: number) => void;
  onTouchStart?: (event: React.TouchEvent, index: number) => void;
}

const Wrapper = styled.div`
  background: #000;
  opacity: 0;
  z-index: 1;
  box-sizing: border-box;
  background-clip: padding-box;
  margin: 2px;
  .hideResizer {
    display: none;
  }
  :hover {
    opacity: 0.1;
  }
`;

const HorizontalWrapper = styled(Wrapper)`
  height: 11px;
  margin: -5px 0;
  border-top: 5px solid rgba(255, 255, 255, 0);
  border-bottom: 5px solid rgba(255, 255, 255, 0);
  cursor: row-resize;
  width: 100%;

  :hover {
    border-top: 5px solid rgba(0, 0, 0, 0.5);
    border-bottom: 5px solid rgba(0, 0, 0, 0.5);
  }

  .disabled {
    cursor: not-allowed;
  }
  .disabled:hover {
    border-color: transparent;
  }
`;

const VerticalWrapper = styled(Wrapper)`
  width: 11px;
  margin: 0 -5px;
  border-left: 5px solid rgba(255, 255, 255, 0);
  border-right: 5px solid rgba(255, 255, 255, 0);
  cursor: col-resize;

  :hover {
    border-left: 5px solid rgba(0, 0, 0, 0.5);
    border-right: 5px solid rgba(0, 0, 0, 0.5);
  }
  .disabled {
    cursor: not-allowed;
  }
  .disabled:hover {
    border-color: transparent;
  }
`;

class Resizer extends Component<ResizerProps> {
  static defaultProps = {
    split: 'vertical',
  };

  resizer: HTMLElement | null = null;

  render() {
    const {
      index,
      split = 'vertical',
      onClick = () => {},
      onDoubleClick = () => {},
      onMouseDown = () => {},
      onTouchEnd = () => {},
      onTouchStart = () => {},
    } = this.props;

    const props = {
      ref: (_:any) => (this.resizer = _),
      'data-attribute': split,
      'data-type': 'Resizer',
      onMouseDown: (event: React.MouseEvent) => onMouseDown(event, index),
      onTouchStart: (event: React.TouchEvent) => {
        event.preventDefault();
        onTouchStart(event, index);
      },
      onTouchEnd: (event: React.TouchEvent) => {
        event.preventDefault();
        onTouchEnd(event, index);
      },
      onClick: (event: React.MouseEvent) => {
        if (onClick) {
          event.preventDefault();
          onClick(event);
        }
      },
      onDoubleClick: (event: React.MouseEvent) => {
        if (onDoubleClick) {
          event.preventDefault();
          onDoubleClick(event);
        }
      },
    };

    return split === 'vertical' ? (
      <VerticalWrapper {...props} />
    ) : (
      <HorizontalWrapper {...props} />
    );
  }
}

export default Resizer;
