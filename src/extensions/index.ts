import {IExtension} from '@dtinsight/molecule/esm/model';
import {LocalExplorerExtension} from './fileExplorer';
import MDExtension from './markdown';
import {SettingsExtension} from "./settings";

const extensions: IExtension[] = [
    new SettingsExtension(),
    new LocalExplorerExtension(),
    new MDExtension()
];

export default extensions;
