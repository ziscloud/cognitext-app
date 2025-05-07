import molecule from '@dtinsight/molecule';
import {IExtension} from '@dtinsight/molecule/esm/model';
import {IExtensionService} from '@dtinsight/molecule/esm/molecule.api';
import {BaseDirectory, exists, mkdir, writeTextFile} from '@tauri-apps/plugin-fs';
import {listen} from '@tauri-apps/api/event';
import {SETTINGS_FILE} from "../../common/consts.ts";

export class SettingsExtension implements IExtension {
    id: string = 'ExtendSettings';
    name: string = 'Extend Settings';

    async ensureDirectoryExists() {
        const dirExists = await exists('', {baseDir: BaseDirectory.AppConfig});
        if (!dirExists) {
            console.log('app config dir is not exists, going to create it')
            await mkdir('', {baseDir: BaseDirectory.AppConfig, recursive: true});
        }
    }

    async handleSettingsChange() {
        await listen('settings-updated', async (event) => {
            const settings = event.payload;
            // Process and save the settings
            console.log('Received settings:', settings);
            //@ts-ignore
            molecule.settings.update(settings);
            await this.ensureDirectoryExists()
            await writeTextFile(SETTINGS_FILE, JSON.stringify(molecule.settings.getSettings()), {
                baseDir: BaseDirectory.AppConfig,
                create: true
            });
        });
    }

    //@ts-ignore
    async activate(extensionCtx: IExtensionService): void {
        console.log('Activate Settings Extension')
        await this.handleSettingsChange();

    }

    //@ts-ignore
    dispose(extensionCtx: IExtensionService): void {
    }
}
