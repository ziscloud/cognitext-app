/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    $convertFromMarkdownString,
    $convertToMarkdownString,
    CHECK_LIST,
    ELEMENT_TRANSFORMERS,
    ElementTransformer,
    MULTILINE_ELEMENT_TRANSFORMERS,
    MultilineElementTransformer,
    TEXT_FORMAT_TRANSFORMERS,
    TEXT_MATCH_TRANSFORMERS,
    TextMatchTransformer,
    Transformer,
} from '@lexical/markdown';
import {
    $createHorizontalRuleNode,
    $isHorizontalRuleNode,
    HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import {
    $createTableCellNode,
    $createTableNode,
    $createTableRowNode,
    $isTableCellNode,
    $isTableNode,
    $isTableRowNode,
    TableCellHeaderStates,
    TableCellNode,
    TableNode,
    TableRowNode,
} from '@lexical/table';
import {
    $createParagraphNode,
    $createTextNode,
    $isParagraphNode,
    $isTextNode,
    ElementNode,
    LexicalNode,
    ParagraphNode,
} from 'lexical';

import {$createEquationNode, $isEquationNode, EquationNode,} from '../../nodes/EquationNode';
import {$createImageNode, $isImageNode, ImageNode} from '../../nodes/ImageNode';
import {$createTweetNode, $isTweetNode, TweetNode} from '../../nodes/TweetNode';
import emojiList from '../../utils/emoji-list';
import {
    $createCollapsibleContainerNode,
    $isCollapsibleContainerNode, CollapsibleContainerNode,
} from '../CollapsiblePlugin/CollapsibleContainerNode';
import {$createCollapsibleTitleNode, CollapsibleTitleNode} from "../CollapsiblePlugin/CollapsibleTitleNode.ts";
import {$createCollapsibleContentNode} from "../CollapsiblePlugin/CollapsibleContentNode.ts";

export const HR: ElementTransformer = {
    dependencies: [HorizontalRuleNode],
    export: (node: LexicalNode) => {
        return $isHorizontalRuleNode(node) ? '***' : null;
    },
    regExp: /^(---|\*\*\*|___)\s?$/,
    replace: (parentNode, _1, _2, isImport) => {
        const line = $createHorizontalRuleNode();

        // TODO: Get rid of isImport flag
        if (isImport || parentNode.getNextSibling() != null) {
            parentNode.replace(line);
        } else {
            parentNode.insertBefore(line);
        }

        line.selectNext();
    },
    type: 'element',
};

export const IMAGE: TextMatchTransformer = {
    dependencies: [ImageNode],
    export: (node) => {
        if (!$isImageNode(node)) {
            return null;
        }

        return `![${node.getAltText()}](${node.getSrc()})`;
    },
    importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
    regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
    replace: (textNode, match) => {
        const [, altText, src] = match;
        const imageNode = $createImageNode({
            altText,
            maxWidth: 800,
            src,
        });
        textNode.replace(imageNode);
    },
    trigger: ')',
    type: 'text-match',
};

export const EMOJI: TextMatchTransformer = {
    dependencies: [],
    export: () => null,
    importRegExp: /:([a-z0-9_]+):/,
    regExp: /:([a-z0-9_]+):$/,
    replace: (textNode, [, name]) => {
        const emoji = emojiList.find((e) => e.aliases.includes(name))?.emoji;
        if (emoji) {
            textNode.replace($createTextNode(emoji));
        }
    },
    trigger: ':',
    type: 'text-match',
};

export const EQUATION: TextMatchTransformer = {
    dependencies: [EquationNode],
    export: (node) => {
        if (!$isEquationNode(node)) {
            return null;
        }

        return `$${node.getEquation()}$`;
    },
    importRegExp: /\$([^$]+?)\$/,
    regExp: /\$([^$]+?)\$$/,
    replace: (textNode, match) => {
        const [, equation] = match;
        const equationNode = $createEquationNode(equation, true);
        textNode.replace(equationNode);
    },
    trigger: '$',
    type: 'text-match',
};

export const TWEET: ElementTransformer = {
    dependencies: [TweetNode],
    export: (node) => {
        if (!$isTweetNode(node)) {
            return null;
        }

        return `<tweet id="${node.getId()}" />`;
    },
    regExp: /<tweet id="([^"]+?)"\s?\/>\s?$/,
    replace: (textNode, _1, match) => {
        const [, id] = match;
        const tweetNode = $createTweetNode(id);
        textNode.replace(tweetNode);
    },
    type: 'element',
};

// Very primitive table setup
const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

export const TABLE: ElementTransformer = {
    dependencies: [TableNode, TableRowNode, TableCellNode],
    export: (node: LexicalNode) => {
        if (!$isTableNode(node)) {
            return null;
        }

        const output: string[] = [];

        for (const row of node.getChildren()) {
            const rowOutput = [];
            if (!$isTableRowNode(row)) {
                continue;
            }

            let isHeaderRow = false;
            for (const cell of row.getChildren()) {
                // It's TableCellNode so it's just to make flow happy
                if ($isTableCellNode(cell)) {
                    rowOutput.push(
                        $convertToMarkdownString(PLAYGROUND_TRANSFORMERS, cell)
                            .replace(/\n/g, '\\n')
                            .trim(),
                    );
                    if (cell.__headerState === TableCellHeaderStates.ROW) {
                        isHeaderRow = true;
                    }
                }
            }

            output.push(`| ${rowOutput.join(' | ')} |`);
            if (isHeaderRow) {
                output.push(`| ${rowOutput.map((_) => '---').join(' | ')} |`);
            }
        }

        return output.join('\n');
    },
    regExp: TABLE_ROW_REG_EXP,
    replace: (parentNode, _1, match) => {
        // Header row
        if (TABLE_ROW_DIVIDER_REG_EXP.test(match[0])) {
            const table = parentNode.getPreviousSibling();
            if (!table || !$isTableNode(table)) {
                return;
            }

            const rows = table.getChildren();
            const lastRow = rows[rows.length - 1];
            if (!lastRow || !$isTableRowNode(lastRow)) {
                return;
            }

            // Add header state to row cells
            lastRow.getChildren().forEach((cell) => {
                if (!$isTableCellNode(cell)) {
                    return;
                }
                cell.setHeaderStyles(
                    TableCellHeaderStates.ROW,
                    TableCellHeaderStates.ROW,
                );
            });

            // Remove line
            parentNode.remove();
            return;
        }

        const matchCells = mapToTableCells(match[0]);

        if (matchCells == null) {
            return;
        }

        const rows = [matchCells];
        let sibling = parentNode.getPreviousSibling();
        let maxCells = matchCells.length;

        while (sibling) {
            if (!$isParagraphNode(sibling)) {
                break;
            }

            if (sibling.getChildrenSize() !== 1) {
                break;
            }

            const firstChild = sibling.getFirstChild();

            if (!$isTextNode(firstChild)) {
                break;
            }

            const cells = mapToTableCells(firstChild.getTextContent());

            if (cells == null) {
                break;
            }

            maxCells = Math.max(maxCells, cells.length);
            rows.unshift(cells);
            const previousSibling = sibling.getPreviousSibling();
            sibling.remove();
            sibling = previousSibling;
        }

        const table = $createTableNode();

        for (const cells of rows) {
            const tableRow = $createTableRowNode();
            table.append(tableRow);

            for (let i = 0; i < maxCells; i++) {
                tableRow.append(i < cells.length ? cells[i] : $createTableCell(''));
            }
        }

        const previousSibling = parentNode.getPreviousSibling();
        if (
            $isTableNode(previousSibling) &&
            getTableColumnsSize(previousSibling) === maxCells
        ) {
            previousSibling.append(...table.getChildren());
            parentNode.remove();
        } else {
            parentNode.replace(table);
        }

        table.selectEnd();
    },
    type: 'element',
};

export const COLLAPSED_SECTION_TRANSFORMER: MultilineElementTransformer = {
    // No extra node dependencies
    dependencies: [CollapsibleTitleNode],
    export: (node: LexicalNode) => {
        if (!$isCollapsibleContainerNode(node)) return null;
        const containerNode = node as CollapsibleContainerNode;
        const children = containerNode.getChildren() as ElementNode[];
        const title = children[0]?.getTextContent() || '';
        let content = '';
        if (children[1]) {
            const contents = children[1]?.getChildren();
            if (contents && contents.length == 1) {
                const paragraphNode = contents[0] as ParagraphNode;
                content = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS, paragraphNode)
            }
        }

        return `<details${containerNode.getOpen() ? ' open' : ''}>\n<summary>${title}</summary>\n\n${content}\n</details>`;
    },
    // Internal type identifier
    type: 'multiline-element',
    // Regex that matches the opening <details><summary>Title</summary> line:
    regExpStart: /<details(\s+open)?>/i,
    // Regex that matches the closing </details> line:
    regExpEnd: /<\/details>/i,

    // Given the parsed data and the child lines in between,
    // return a CollapsibleNode instance containing them.
    replace: (
        parentNode: ElementNode,
        //@ts-ignore
        children: Array<LexicalNode> | null,
        startMatch: Array<string>,
        //@ts-ignore
        endMatch: Array<string> | null,
        linesInBetween: Array<string> | null,
        //@ts-ignore
        isImport: boolean
    ): void => {
        const [_, openAttr] = startMatch;
        const container = $createCollapsibleContainerNode(!!openAttr?.includes('open'));
        const content: string[] = [];
        let findTitle = false;
        linesInBetween?.forEach((line) => {
            const match = line.match(/<summary>([\s\S]*?)<\/summary>/);
            if (!match || !match[1]) {
                if (findTitle) {
                    content.push(line)
                    return;
                }
            } else {
                findTitle = true;
                const title = $createCollapsibleTitleNode()
                    .append($createParagraphNode().append($createTextNode(match?.[1]?.trim())));
                container.append(title)
            }
        })

        const paragraphNode = $createParagraphNode();
        const contentNode = $createCollapsibleContentNode().append(paragraphNode);
        $convertFromMarkdownString(
            content.join("\n"),
            PLAYGROUND_TRANSFORMERS,
            paragraphNode,
            false,
            false,
        )
        container.append(contentNode);
        parentNode.append(container);
    },
};

function getTableColumnsSize(table: TableNode) {
    const row = table.getFirstChild();
    return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const $createTableCell = (textContent: string): TableCellNode => {
    textContent = textContent.replace(/\\n/g, '\n');
    const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
    $convertFromMarkdownString(textContent, PLAYGROUND_TRANSFORMERS, cell);
    return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
    const match = textContent.match(TABLE_ROW_REG_EXP);
    if (!match || !match[1]) {
        return null;
    }
    return match[1].split('|').map((text) => $createTableCell(text));
};

export const PLAYGROUND_TRANSFORMERS: Array<Transformer> = [
    TABLE,
    HR,
    IMAGE,
    EMOJI,
    EQUATION,
    TWEET,
    CHECK_LIST,
    ...ELEMENT_TRANSFORMERS,
    ...MULTILINE_ELEMENT_TRANSFORMERS,
    COLLAPSED_SECTION_TRANSFORMER,
    ...TEXT_FORMAT_TRANSFORMERS,
    ...TEXT_MATCH_TRANSFORMERS,
];
