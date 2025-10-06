import { NativeModules } from 'react-native';
const { AppUsage } = NativeModules;

export const getAppUsageMinutes = async (packageName: string): Promise<number> => {
    return await AppUsage.getAppUsage(packageName);
};