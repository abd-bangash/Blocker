package com.f_y_p

import android.app.usage.UsageStatsManager
import android.content.Context
import android.app.AppOpsManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import java.util.*

class AppUsageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val appContext: Context = reactContext.applicationContext

    override fun getName(): String = "AppUsage"
    @ReactMethod
fun getAppUsage(packageName: String, promise: Promise) {
    try {
        val usm = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()

        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        val startOfDay = cal.timeInMillis

        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startOfDay, now)

        if (stats.isNullOrEmpty()) {
            promise.resolve(0)
            return
        }

        val usage = stats.find { it.packageName == packageName }
        val minutes = (usage?.totalTimeInForeground ?: 0L) / (1000 * 60)
        promise.resolve(minutes.toDouble()) // ✅ safe type for RN
    } catch (e: Exception) {
        promise.reject("ERROR", "Failed to get usage", e)
    }
}

}
