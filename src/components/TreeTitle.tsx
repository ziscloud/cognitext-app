import React from "react";
import {toValue} from "./react-split-pane-next/utils.ts";

const indent = 24;
const icon =24;
const switcher = 24;
const padding = 16;

const TreeTitle: React.FC<{
    nodeData: any;
    width: string;
}> = ({nodeData, width}) => {
    return (
        <span key={nodeData.key} style={{
            display: 'inline-block',
            width: toValue(width) - (nodeData.level * indent) - icon - switcher - padding,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }}>{nodeData.title}</span>
    )
};

export default React.memo(TreeTitle);
