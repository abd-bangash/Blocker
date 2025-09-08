import { NativeModules } from 'react-native';
import { InstalledApp } from '../types/apps';

const { InstalledApps } = NativeModules;

export const getInstalledApps = async (): Promise<InstalledApp[]> => {
    return InstalledApps.getInstalledApps();
};
