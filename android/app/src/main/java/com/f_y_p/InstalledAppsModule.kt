package com.f_y_p

import android.content.pm.PackageManager
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = "InstalledApps")
class InstalledAppsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "InstalledApps"

    @ReactMethod
fun getInstalledApps(promise: Promise) {
    try {
        val pm = reactApplicationContext.packageManager
        val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)

        val appsArray = Arguments.createArray()

        for (appInfo in apps) {
            // Check if app has a launcher intent
            val launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName)

            if (launchIntent != null) {
                val map = Arguments.createMap()
                map.putString("packageName", appInfo.packageName)
                map.putString("name", pm.getApplicationLabel(appInfo).toString())
                appsArray.pushMap(map)
            }
        }

        promise.resolve(appsArray)
    } catch (e: Exception) {
        promise.reject("ERROR", "Failed to fetch installed apps", e)
    }
}
}
