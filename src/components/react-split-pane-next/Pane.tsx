import React, {PureComponent} from 'react';
import {prefix} from 'inline-style-prefixer'
import {getUnit, convertSizeToCssValue} from './utils';

// 定义Pane组件的props类型
interface PaneProps {
    children?: React.ReactNode;
    className?: string;
    index?: number;
    innerRef?: (index: number, element: HTMLElement | null) => void;
    initialSize?: string | number;
    minSize?: string;
    maxSize?: string;
    split?: 'vertical' | 'horizontal';
    size?: string | number;
    resizerSize?: string | number;
    style?: React.CSSProperties;
}

// 定义PaneStyle函数参数类型
interface PaneStyleProps {
    split?: 'vertical' | 'horizontal';
    initialSize?: string | number;
    size?: string | number;
    minSize?: string;
    maxSize?: string;
    resizerSize?: string | number;
}

function PaneStyle({
                       split,
                       initialSize,
                       size,
                       minSize,
                       maxSize,
                       resizerSize,
                   }: PaneStyleProps) {
    const value = size || initialSize;
    const vertical = split === 'vertical';

    let style: {
        width?: string,
        height?: string,
        minWidth?: string,
        maxWidth?: string,
        minHeight?: string,
        maxHeight?: string,
        flex?: string|number|undefined,
        flexGrow?: number,
        display: string,
        outline: string
    } = {
        display: 'flex' as const,
        outline: 'none' as const,
    };
    if (vertical ) {
        if (minSize) {
            style.minWidth = convertSizeToCssValue(minSize, resizerSize);
        }
        if (maxSize) {
            style.maxWidth = convertSizeToCssValue(maxSize, resizerSize);
        }
    } else {
        if (minSize) {
            style.minHeight = convertSizeToCssValue(minSize, resizerSize);
        }
        if (maxSize) {
            style.maxHeight = convertSizeToCssValue(maxSize, resizerSize);
        }
    }
//@ts-ignore
    switch (getUnit(value)) {
        case 'ratio':
            style.flex = value;
            break;
        case '%':
        case 'px':
            style.flexGrow = 0;
            if (value) {
                if (vertical) {
                    style.width = convertSizeToCssValue(value.toString(), resizerSize);
                } else {
                    style.height = convertSizeToCssValue(value.toString(), resizerSize);
                }
            }
            break;
    }

    return style;
}

class Pane extends PureComponent<PaneProps> {
    static defaultProps = {
        initialSize: '1',
        split: 'vertical',
        minSize: '0',
        maxSize: '100%',
    };

    setRef = (element: HTMLElement | null) => {
        this.props.innerRef?.(this.props.index!, element);
    };

    render() {
        const {children, className} = this.props;
        const prefixedStyle = prefix(PaneStyle(this.props));

        return (
            <div className={className} style={{...prefixedStyle, ...this.props.style}} ref={this.setRef}>
                {children}
            </div>
        );
    }
}

export default Pane;
