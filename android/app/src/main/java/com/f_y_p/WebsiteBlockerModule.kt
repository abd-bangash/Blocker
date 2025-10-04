// android/app/src/main/java/control/BlockerModule.kt
package com.f_y_p

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*

class WebsiteBlockerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences =
        reactContext.getSharedPreferences("BlockerPrefs", Context.MODE_PRIVATE)

    override fun getName(): String {
        return "WebsiteBlockerModule"
    }

    // ✅ Get list of blocked websites
    @ReactMethod
    fun getBlockedWebsites(promise: Promise) {
        try {
            val sites = prefs.getStringSet("blocked_websites", HashSet()) ?: HashSet()
            val result = Arguments.createArray()
            for (site in sites) {
                result.pushString(site)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_ERROR", "Failed to get blocked websites", e)
        }
    }

    // ✅ Add new website
    @ReactMethod
    fun addBlockedWebsite(url: String, promise: Promise) {
        try {
            val sites = prefs.getStringSet("blocked_websites", HashSet())?.toMutableSet() ?: mutableSetOf()
            sites.add(url)
            prefs.edit().putStringSet("blocked_websites", sites).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ADD_ERROR", "Failed to add website", e)
        }
    }

    // ✅ Remove website
    @ReactMethod
    fun removeBlockedWebsite(url: String, promise: Promise) {
        try {
            val sites = prefs.getStringSet("blocked_websites", HashSet())?.toMutableSet() ?: mutableSetOf()
            sites.remove(url)
            prefs.edit().putStringSet("blocked_websites", sites).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("REMOVE_ERROR", "Failed to remove website", e)
        }
    }
}
