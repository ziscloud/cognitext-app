/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {JSX, useCallback, useMemo} from 'react';

import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {LexicalContextMenuPlugin, MenuOption,} from '@lexical/react/LexicalContextMenuPlugin';
import {
    $getNearestNodeFromDOMNode,
    $getSelection,
    $isDecoratorNode,
    $isNodeSelection,
    $isRangeSelection,
    type LexicalNode,
} from 'lexical';
import * as ReactDOM from 'react-dom';
import {SEARCH_THE_WEB_COMMAND} from "../WebSearchPlugin";
import {RiDeleteBack2Line} from "react-icons/ri";
import {TbWorldSearch} from "react-icons/tb";

function ContextMenuItem({
                             index,
                             isSelected,
                             onClick,
                             onMouseEnter,
                             option,
                         }: {
    index: number;
    isSelected: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    option: ContextMenuOption;
}) {
    let className = 'item';
    if (isSelected) {
        className += ' selected';
    }
    return (
        <li
            key={option.key}
            tabIndex={-1}
            className={className}
            ref={option.setRefElement}
            role="option"
            aria-selected={isSelected}
            id={'typeahead-item-' + index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}>
            <span style={{
                display: 'inline-flex',
                marginRight: '2px',
                minWidth: '20px',
                textAlign: 'center',
                alignItems: 'center',
            }}>{option.icon}</span>
            <span className="text">{option.title}</span>
        </li>
    );
}

function ContextMenu({
                         options,
                         selectedItemIndex,
                         onOptionClick,
                         onOptionMouseEnter,
                     }: {
    selectedItemIndex: number | null;
    onOptionClick: (option: ContextMenuOption, index: number) => void;
    onOptionMouseEnter: (index: number) => void;
    options: Array<ContextMenuOption>;
}) {
    return (
        <div className="typeahead-popover">
            <ul>
                {options.map((option: ContextMenuOption, i: number) => (
                    <ContextMenuItem
                        index={i}
                        isSelected={selectedItemIndex === i}
                        onClick={() => onOptionClick(option, i)}
                        onMouseEnter={() => onOptionMouseEnter(i)}
                        key={option.key}
                        option={option}
                    />
                ))}
            </ul>
        </div>
    );
}

export class ContextMenuOption extends MenuOption {
    title: string;
    icon: JSX.Element | null;
    onSelect: (targetNode: LexicalNode | null) => void;

    constructor(
        title: string,
        icon: JSX.Element | null,
        options: {
            onSelect: (targetNode: LexicalNode | null) => void;
        },
    ) {
        super(title);
        this.title = title;
        this.icon = icon;
        this.onSelect = options.onSelect.bind(this);
    }
}

export default function ContextMenuPlugin(): JSX.Element {
    const [editor] = useLexicalComposerContext();

    const defaultOptions = useMemo(() => {
        return [
            new ContextMenuOption(`Delete Node`, <RiDeleteBack2Line/>, {
                onSelect: (_node) => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const currentNode = selection.anchor.getNode();
                        const ancestorNodeWithRootAsParent = currentNode
                            .getParents()
                            //@ts-ignore
                            .at(-2);

                        ancestorNodeWithRootAsParent?.remove();
                    } else if ($isNodeSelection(selection)) {
                        const selectedNodes = selection.getNodes();
                        selectedNodes.forEach((node) => {
                            if ($isDecoratorNode(node)) {
                                node.remove();
                            }
                        });
                    }
                },
            }),
        ];
    }, [editor]);

    const [options, setOptions] = React.useState(defaultOptions);

    const onSelectOption = useCallback(
        (
            selectedOption: ContextMenuOption,
            targetNode: LexicalNode | null,
            closeMenu: () => void,
        ) => {
            editor.update(() => {
                selectedOption.onSelect(targetNode);
                closeMenu();
            });
        },
        [editor],
    );

    const onWillOpen = (event: MouseEvent) => {
        let newOptions = defaultOptions;
        editor.update(() => {
            const node = $getNearestNodeFromDOMNode(event.target as Element);
            if (node) {
                const parent = node.getParent();
                if ($isLinkNode(parent)) {
                    newOptions = [
                        new ContextMenuOption(`Remove Link`, null, {
                            onSelect: (_node) => {
                                editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                            },
                        }),
                        ...defaultOptions,
                    ];
                }
            }
            const selection = $getSelection();
            if ($isRangeSelection(selection) && selection.getTextContent()) {
                newOptions = [
                    new ContextMenuOption(`Search the web`, <TbWorldSearch/>, {
                        onSelect: (_node) => {
                            editor.dispatchCommand(SEARCH_THE_WEB_COMMAND, selection.getTextContent());
                        },
                    }),
                    ...defaultOptions,
                ];
            }
        });
        setOptions(newOptions);
    };

    return (
        <LexicalContextMenuPlugin
            options={options}
            onSelectOption={onSelectOption}
            onWillOpen={onWillOpen}
            menuRenderFn={(
                anchorElementRef,
                {
                    selectedIndex,
                    options: _options,
                    selectOptionAndCleanUp,
                    setHighlightedIndex,
                },
                {setMenuRef},
            ) => {
                return (anchorElementRef.current
                    ? ReactDOM.createPortal(
                        <div
                            className="typeahead-popover auto-embed-menu"
                            style={{
                                marginLeft: anchorElementRef.current.style.width,
                                userSelect: 'none',
                                width: 200,
                                zIndex: 1,
                            }}
                            ref={setMenuRef}>
                            <ContextMenu
                                options={options}
                                selectedItemIndex={selectedIndex}
                                onOptionClick={(option: ContextMenuOption, index: number) => {
                                    setHighlightedIndex(index);
                                    selectOptionAndCleanUp(option);
                                }}
                                onOptionMouseEnter={(index: number) => {
                                    setHighlightedIndex(index);
                                }}
                            />
                        </div>,
                        anchorElementRef.current,
                    )
                    : null);
            }
            }
        />
    );
}
