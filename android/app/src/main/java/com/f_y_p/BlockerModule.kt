package com.f_y_p

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class BlockerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "Blocker"

    private val prefs = reactApplicationContext.getSharedPreferences("blocked_apps", Context.MODE_PRIVATE)

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray) {
        val set = mutableSetOf<String>()
        for (i in 0 until apps.size()) {
            apps.getString(i)?.let { set.add(it) }
        }
        prefs.edit().putStringSet("apps", set).apply()
        Log.d("BlockerModule", "setBlockedApps: $set")
    }

    @ReactMethod
    fun addBlockedApp(appPackage: String) {
        val current = prefs.getStringSet("apps", mutableSetOf())?.toMutableSet() ?: mutableSetOf()
        current.add(appPackage)
        prefs.edit().putStringSet("apps", current).apply()
        Log.d("BlockerModule", "addBlockedApp: $appPackage, new set: $current")
    }

    @ReactMethod
    fun removeBlockedApp(appPackage: String) {
        val current = prefs.getStringSet("apps", mutableSetOf())?.toMutableSet() ?: mutableSetOf()
        current.remove(appPackage)
        prefs.edit().putStringSet("apps", current).apply()
        Log.d("BlockerModule", "removeBlockedApp: $appPackage, new set: $current")
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        val current = prefs.getStringSet("apps", mutableSetOf()) ?: mutableSetOf()
        val appsArray = Arguments.createArray()
        for (pkg in current) {
            val map = Arguments.createMap()
            map.putString("packageName", pkg)
            map.putString("name", pkg) // You can improve this by saving app name too
            appsArray.pushMap(map)
        }
        promise.resolve(appsArray)
    }
}
