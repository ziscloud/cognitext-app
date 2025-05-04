import {IExtension} from '@dtinsight/molecule/esm/model';
import {LocalExplorerExtension} from './fileExplorer';
import MDExtension from './markdown';

const extensions: IExtension[] = [
    new LocalExplorerExtension(),
    new MDExtension(),
];

export default extensions;
