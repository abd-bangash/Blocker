import { NativeModules } from 'react-native';
import { BlockedApp } from '../types/apps';

const { Blocker } = NativeModules;

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