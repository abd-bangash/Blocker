import { NativeModules } from 'react-native';
import { BlockedApp } from '../types/apps';

const { Blocker, WebsiteBlockerModule } = NativeModules;

export const getBlockedApps = async (): Promise<BlockedApp[]> => {
    const apps = await Blocker.getBlockedApps();
    return apps as BlockedApp[];
};

export const addBlockedApp = async (packageName: string) => {
    await Blocker.addBlockedApp(packageName);
};

export const removeBlockedApp = async (packageName: string) => {
    await Blocker.removeBlockedApp(packageName);
};

export const isBlockingEnabled = async (): Promise<boolean> => {
    return await Blocker.isBlockingEnabled();
};

export const setBlockingEnabled = async (enabled: boolean) => {
    await Blocker.setBlockingEnabled(enabled);
};

export const getBlockSchedule = async (): Promise<{ start: number; end: number } | null> => {
    if (!Blocker.getBlockSchedule) return null;
    return await Blocker.getBlockSchedule();
};

export const setBlockSchedule = async (start: number, end: number) => {
    if (Blocker.setBlockSchedule) {
        await Blocker.setBlockSchedule(start, end);
    }
};

export const getUsageLimit = async (packageName: string): Promise<number> => {
    if (!Blocker.getUsageLimit) return 0;
    return await Blocker.getUsageLimit(packageName);
};

export const setUsageLimit = async (packageName: string, minutes: number) => {
    if (Blocker.setUsageLimit) await Blocker.setUsageLimit(packageName, minutes);
};

export const getBlockedWebsites = async (): Promise<string[]> => {
    return await WebsiteBlockerModule.getBlockedWebsites();
};

export const addBlockedWebsite = async (url: string): Promise<void> => {
    console.log(WebsiteBlockerModule)
    await WebsiteBlockerModule.addBlockedWebsite(url);
};

export const removeBlockedWebsite = async (url: string): Promise<void> => {
    await WebsiteBlockerModule.removeBlockedWebsite(url);
};