import { Global, Injectable, OnModuleInit } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';

@Global()
@Injectable()
export class CustomSettingService implements OnModuleInit {
    private settingsCache: Record<string, any> = {};

    async onModuleInit() {
        console.log('Initializing CustomSettingService...');
        await this.loadSettings();
        console.log('CustomSettingService initialized.');
    }

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient
    ) {
        this.loadSettings();
    }

    async loadSettings() {
        const query = 'SELECT NAME as name, VALUE as value FROM CUSTOM_SETTING';
        const res = await (await this.clickdb.query({ query })).json();
        res.data.forEach((setting: any) => {
            this.settingsCache[setting.name] = setting.value;
        });
    }

    getSetting(key: string): any {
        return this.settingsCache[key];
    }

    async updateSetting(key: string, value: any) {
        const query = `ALTER TABLE CUSTOM_SETTINGS UPDATE VALUE = '${value}' WHERE NAME = '${key}'`;
        await this.clickdb.query({ query });
        // Update the cache
        this.settingsCache[key] = value;
    }

    async reloadSettings() {
        await this.loadSettings();
    }
}
