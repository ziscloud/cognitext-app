import {useEffect} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$convertFromMarkdownString} from '@lexical/markdown';
import {PLAYGROUND_TRANSFORMERS} from "../MarkdownTransformers";

interface MarkdownUpdaterProps {
    markdown: string;
}

const MarkdownUpdater: React.FC<MarkdownUpdaterProps> = ({markdown}) => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editor.update(() => {
            console.log('markdown', Date.now())
            $convertFromMarkdownString(markdown, PLAYGROUND_TRANSFORMERS);
        });
    }, [editor, markdown]);

    return null;
};

export default MarkdownUpdater;
