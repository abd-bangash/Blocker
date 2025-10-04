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
            map.putString("name", pkg) // improve by saving real name if needed
            appsArray.pushMap(map)
        }
        promise.resolve(appsArray)
    }

    @ReactMethod
    fun setBlockingEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("blocking_enabled", enabled).apply()
        Log.d("BlockerModule", "setBlockingEnabled: $enabled")
    }

    @ReactMethod
    fun isBlockingEnabled(promise: Promise) {
        val enabled = prefs.getBoolean("blocking_enabled", true)
        promise.resolve(enabled)
    }

    @ReactMethod
    fun setBlockSchedule(start: Int, end: Int) {
        prefs.edit().putInt("block_start", start).putInt("block_end", end).apply()
        Log.d("BlockerModule", "setBlockSchedule: $start to $end")
    }

    @ReactMethod
    fun getBlockSchedule(promise: Promise) {
        val start = prefs.getInt("block_start", -1)
        val end = prefs.getInt("block_end", -1)
        val map = Arguments.createMap()
        map.putInt("start", start)
        map.putInt("end", end)
        promise.resolve(map)
    }

    @ReactMethod
    fun setUsageLimit(packageName: String, minutes: Int) {
        prefs.edit().putInt("limit_$packageName", minutes).apply()
        Log.d("BlockerModule", "setUsageLimit: $packageName -> $minutes min")
    }

    @ReactMethod
    fun getUsageLimit(packageName: String, promise: Promise) {
        val limit = prefs.getInt("limit_$packageName", 0)
        promise.resolve(limit)
    }

    @ReactMethod
    fun removeUsageLimit(packageName: String) {
        prefs.edit().remove("limit_$packageName").apply()
        Log.d("BlockerModule", "removeUsageLimit: $packageName")
    }

    @ReactMethod
    fun getAllUsageLimits(promise: Promise) {
        val all = Arguments.createArray()
        val allPrefs = prefs.all
        for ((key, value) in allPrefs) {
            if (key.startsWith("limit_") && value is Int) {
                val map = Arguments.createMap()
                map.putString("packageName", key.removePrefix("limit_"))
                map.putInt("limit", value)
                all.pushMap(map)
            }
        }
        promise.resolve(all)
    }

    // 🔹 NEW METHODS for Global Block (Pomodoro Mode)

    @ReactMethod
    fun setGlobalBlock(minutes: Int) {
        val endTime = System.currentTimeMillis() + minutes * 60 * 1000
        prefs.edit().putLong("global_block_end", endTime).apply()
        Log.d("BlockerModule", "Global block set for $minutes minutes (until $endTime)")
    }

    @ReactMethod
    fun clearGlobalBlock() {
        prefs.edit().remove("global_block_end").apply()
        Log.d("BlockerModule", "Global block cleared manually")
    }

    @ReactMethod
    fun isGlobalBlockActive(promise: Promise) {
        val endTime = prefs.getLong("global_block_end", -1)
        val active = endTime > System.currentTimeMillis()
        promise.resolve(active)
    }

    @ReactMethod
    fun getGlobalBlockEndTime(promise: Promise) {
        val endTime = prefs.getLong("global_block_end", -1)
        promise.resolve(endTime)
    }
}
