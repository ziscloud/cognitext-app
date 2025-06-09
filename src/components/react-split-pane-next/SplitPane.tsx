import React, { Component, cloneElement } from 'react';
import styled from 'styled-components';
import Resizer from './Resizer';
import Pane from './Pane';
import { getUnit, convertToUnit, convert } from './utils';

// 定义SplitPane组件的props类型
interface SplitPaneProps {
  children: React.ReactNode[];
  className?: string;
  split?: 'vertical' | 'horizontal';
  resizerSize?: number;
  onChange?: (sizes: string[]) => void;
  onResizeStart?: () => void;
  onResizeEnd?: (sizes: string[]) => void;
  allowResize?: boolean;
}

// 定义SplitPane组件的state类型
interface SplitPaneState {
  sizes: string[];
}

// 定义维度快照的类型
interface DimensionsSnapshot {
  resizerSize: number;
  paneDimensions: DOMRect[];
  splitPaneSizePx: number;
  minSizesPx: number[];
  maxSizesPx: number[];
  sizesPx: number[];
}

const DEFAULT_PANE_SIZE = '1';
const DEFAULT_PANE_MIN_SIZE = '0';
const DEFAULT_PANE_MAX_SIZE = '100%';

const ColumnStyle = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  flex: 1;
  outline: none;
  overflow: hidden;
  user-select: text;
`;

const RowStyle = styled.div`
  display: flex;
  height: 100%;
  flex-direction: row;
  flex: 1;
  outline: none;
  overflow: hidden;
  user-select: text;
`;

function removeNullChildren(children: React.ReactNode[]): React.ReactNode[] {
  return React.Children.toArray(children).filter((c) => c);
}

class SplitPane extends Component<SplitPaneProps, SplitPaneState> {
  static defaultProps = {
    split: 'vertical',
    resizerSize: 1,
    allowResize: true,
  };

  private paneElements: (HTMLElement | null)[] = [];
  private splitPane: HTMLElement | null = null;
  private resizerIndex: number | null = null;
  private dimensionsSnapshot: DimensionsSnapshot | null = null;
  private startClientX: number = 0;
  private startClientY: number = 0;

  constructor(props: SplitPaneProps) {
    super(props);

    this.state = {
      sizes: this.getPanePropSize(props),
    };
  }

  // componentWillReceiveProps(nextProps: SplitPaneProps): void {
  //   this.setState({ sizes: this.getPanePropSize(nextProps) });
  // }

  componentWillUnmount(): void {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);

    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onMouseUp);
  }

  onMouseDown = (event: React.MouseEvent, resizerIndex: number): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    this.onDown(resizerIndex, event.clientX, event.clientY);
  };

  onTouchStart = (event: React.TouchEvent, resizerIndex: number): void => {
    event.preventDefault();

    const { clientX, clientY } = event.touches[0];

    this.onDown(resizerIndex, clientX, clientY);
  };

  onDown = (resizerIndex: number, clientX: number, clientY: number): void => {
    const { allowResize, onResizeStart } = this.props;

    if (!allowResize) {
      return;
    }

    this.resizerIndex = resizerIndex;
    this.dimensionsSnapshot = this.getDimensionsSnapshot(this.props);
    this.startClientX = clientX;
    this.startClientY = clientY;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);

    document.addEventListener('touchmove', this.onTouchMove);
    document.addEventListener('touchend', this.onMouseUp);
    document.addEventListener('touchcancel', this.onMouseUp);

    if (onResizeStart) {
      onResizeStart();
    }
  };

  onMouseMove = (event: MouseEvent): void => {
    event.preventDefault();

    this.onMove(event.clientX, event.clientY);
  };

  onTouchMove = (event: TouchEvent): void => {
    event.preventDefault();

    const { clientX, clientY } = event.touches[0];

    this.onMove(clientX, clientY);
  };

  onMouseUp = (event: MouseEvent | TouchEvent): void => {
    event.preventDefault();

    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);

    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onMouseUp);
    document.removeEventListener('touchcancel', this.onMouseUp);

    if (this.props.onResizeEnd) {
      this.props.onResizeEnd(this.state.sizes);
    }
  };

  getDimensionsSnapshot(props: SplitPaneProps): DimensionsSnapshot {
    const split = props.split || 'vertical';
    const paneDimensions = this.getPaneDimensions();
    const splitPaneDimensions = this.splitPane?.getBoundingClientRect() || {
      width: 0,
      height: 0,
    };
    const minSizes = this.getPanePropMinMaxSize(props, 'minSize');
    const maxSizes = this.getPanePropMinMaxSize(props, 'maxSize');

    const resizerSize = this.getResizerSize(
      removeNullChildren(props.children)
    );
    const splitPaneSizePx =
      split === 'vertical'
        ? splitPaneDimensions.width - resizerSize
        : splitPaneDimensions.height - resizerSize;

    const minSizesPx = minSizes.map((s) => convert(s, splitPaneSizePx));
    const maxSizesPx = maxSizes.map((s) => convert(s, splitPaneSizePx));
    const sizesPx = paneDimensions.map((d) =>
      split === 'vertical' ? d.width : d.height
    );

    return {
      resizerSize,
      paneDimensions,
      splitPaneSizePx,
      minSizesPx,
      maxSizesPx,
      sizesPx,
    };
  }

  getPanePropSize(props: SplitPaneProps): string[] {
    return removeNullChildren(props.children).map((child:  React.ReactNode) => {
      //@ts-ignore
      const value = child?.props['size'] || child.props['initialSize'];
      if (value === undefined) {
        return DEFAULT_PANE_SIZE;
      }

      return String(value);
    });
  }

  getPanePropMinMaxSize(props: SplitPaneProps, key: string): string[] {
    return removeNullChildren(props.children).map((child) => {
      //@ts-ignore
      const value = child.props[key];
      if (value === undefined) {
        return key === 'maxSize'
          ? DEFAULT_PANE_MAX_SIZE
          : DEFAULT_PANE_MIN_SIZE;
      }

      return value;
    });
  }

  getPaneDimensions(): DOMRect[] {
    return this.paneElements
      .filter((el) => el!=null)
      .map((el) => el.getBoundingClientRect());
  }

  getSizes(): string[] {
    return this.state.sizes;
  }

  onMove(clientX: number, clientY: number): void {
    const { split, onChange } = this.props;
    const resizerIndex = this.resizerIndex;
    const {
      sizesPx,
      minSizesPx,
      maxSizesPx,
      splitPaneSizePx,
      paneDimensions,
    } = this.dimensionsSnapshot || {
      sizesPx: [],
      minSizesPx: [],
      maxSizesPx: [],
      splitPaneSizePx: 0,
      paneDimensions: [],
    };

    if (resizerIndex === null || !paneDimensions[resizerIndex]) {
      return;
    }

    const sizeDim = split === 'vertical' ? 'width' : 'height';
    const primary = paneDimensions[resizerIndex];
    const secondary = paneDimensions[resizerIndex + 1];
    const maxSize = primary[sizeDim] + secondary[sizeDim];

    const primaryMinSizePx = minSizesPx[resizerIndex];
    const secondaryMinSizePx = minSizesPx[resizerIndex + 1];
    const primaryMaxSizePx = Math.min(maxSizesPx[resizerIndex], maxSize);
    const secondaryMaxSizePx = Math.min(
      maxSizesPx[resizerIndex + 1],
      maxSize
    );

    const moveOffset =
      split === 'vertical'
        ? this.startClientX - clientX
        : this.startClientY - clientY;

    let primarySizePx = primary[sizeDim] - moveOffset;
    let secondarySizePx = secondary[sizeDim] + moveOffset;

    let primaryHasReachedLimit = false;
    let secondaryHasReachedLimit = false;

    if (primarySizePx < primaryMinSizePx) {
      primarySizePx = primaryMinSizePx;
      primaryHasReachedLimit = true;
    } else if (primarySizePx > primaryMaxSizePx) {
      primarySizePx = primaryMaxSizePx;
      primaryHasReachedLimit = true;
    }

    if (secondarySizePx < secondaryMinSizePx) {
      secondarySizePx = secondaryMinSizePx;
      secondaryHasReachedLimit = true;
    } else if (secondarySizePx > secondaryMaxSizePx) {
      secondarySizePx = secondaryMaxSizePx;
      secondaryHasReachedLimit = true;
    }

    if (primaryHasReachedLimit) {
      secondarySizePx = primary[sizeDim] + secondary[sizeDim] - primarySizePx;
    } else if (secondaryHasReachedLimit) {
      primarySizePx = primary[sizeDim] + secondary[sizeDim] - secondarySizePx;
    }

    sizesPx[resizerIndex] = primarySizePx;
    sizesPx[resizerIndex + 1] = secondarySizePx;

    let sizes = this.getSizes().concat();
    let updateRatio: boolean = false;

    [primarySizePx, secondarySizePx].forEach((paneSize, idx) => {
      const unit = getUnit(sizes[resizerIndex + idx]);
      if (unit !== 'ratio') {
        //@ts-ignore
        sizes[resizerIndex + idx] = convertToUnit(
          paneSize,
          unit,
          splitPaneSizePx
        );
      } else {
        updateRatio = true;
      }
    });

    if (updateRatio) {
      let ratioCount = 0;
      let lastRatioIdx: number | undefined;
      //@ts-ignore
      sizes = sizes.map((size, idx) => {
        if (getUnit(size) === 'ratio') {
          ratioCount++;
          lastRatioIdx = idx;
          //@ts-ignore
          return convertToUnit(sizesPx[idx], 'ratio');
        }

        return size;
      });

      if (ratioCount === 1 && lastRatioIdx !== undefined) {
        sizes[lastRatioIdx] = '1';
      }
    }

    onChange && onChange(sizes);

    this.setState({
      sizes,
    });
  }

  setPaneRef = (idx: number, el: HTMLElement | null): void => {
    if (!this.paneElements) {
      this.paneElements = [];
    }

    this.paneElements[idx] = el;
  };

  getResizerSize(children: React.ReactNode[]): number {
    return (children.length - 1) * (this.props.resizerSize || 1);
  }

  render(): React.ReactNode {
    const { className, split = 'vertical' } = this.props;
    const notNullChildren = removeNullChildren(this.props.children);
    const sizes = this.getSizes();
    const resizerSize = this.getResizerSize(notNullChildren);

    const elements = notNullChildren.reduce(
      (acc: React.ReactNode[], child, idx) => {
        let pane;
        const resizerIndex = idx - 1;
        const isPane = (child as React.ReactElement).type === Pane;
        const paneProps = {
          index: idx,
          'data-type': 'Pane',
          split: split,
          key: `Pane-${idx}`,
          innerRef: this.setPaneRef,
          resizerSize,
          size: sizes[idx],
        };

        if (isPane) {
          pane = cloneElement(child as React.ReactElement, paneProps);
        } else {
          pane = <Pane {...paneProps}>{child}</Pane>;
        }

        if (acc.length === 0) {
          return [...acc, pane];
        } else {
          const resizer = (
            <Resizer
              index={resizerIndex}
              key={`Resizer-${resizerIndex}`}
              split={split}
              onMouseDown={this.onMouseDown}
              onTouchStart={this.onTouchStart}
            />
          );

          return [...acc, resizer, pane];
        }
      },
      []
    );

    const StyleComponent = split === 'vertical' ? RowStyle : ColumnStyle;

    return (
      <StyleComponent
        className={className}
        data-type="SplitPane"
        data-split={split}
        ref={(el) => {
          this.splitPane = el;
        }}
      >
        {elements}
      </StyleComponent>
    );
  }
}

export default SplitPane;
