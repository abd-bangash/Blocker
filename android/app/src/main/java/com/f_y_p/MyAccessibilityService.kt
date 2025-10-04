package com.f_y_p

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.content.Context
import android.view.accessibility.AccessibilityEvent
import android.util.Log
import com.f_y_p.BlockedActivity

class AppBlockerService : AccessibilityService() {

    private val handler = android.os.Handler()
    private val checkRunnable = object : Runnable {
        override fun run() {
            if (isBlockingEnabled() && isWithinSchedule()) {
                val packageName = rootInActiveWindow?.packageName?.toString()

                val blockedApps = getBlockedApps()
                if (packageName != null && blockedApps.contains(packageName)) {
                    val intent = Intent(this@AppBlockerService, BlockedActivity::class.java)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    intent.putExtra("APP_NAME", packageName)
                    startActivity(intent)
                }
            }
            handler.postDelayed(this, 5000) // check every 5 sec
        }
    }
    private fun getBlockedApps(): List<String> {
        val prefs = applicationContext.getSharedPreferences("blocked_apps", Context.MODE_PRIVATE)
        val savedApps = prefs.getStringSet("apps", emptySet()) ?: emptySet()
        val allBlocked = savedApps.toList()
        Log.d("AppBlockerService", "getBlockedApps: $allBlocked")
        return allBlocked
    }

    private fun isBlockingEnabled(): Boolean {
        val prefs = applicationContext.getSharedPreferences("blocked_apps", Context.MODE_PRIVATE)
        return prefs.getBoolean("blocking_enabled", true)
    }

    private fun isWithinSchedule(): Boolean {
        val prefs = applicationContext.getSharedPreferences("blocked_apps", Context.MODE_PRIVATE)
        val start = prefs.getInt("block_start", -1)
        val end = prefs.getInt("block_end", -1)
        if (start == -1 || end == -1) return true // always block if not set

        val now = java.util.Calendar.getInstance()
        val minutesNow = now.get(java.util.Calendar.HOUR_OF_DAY) * 60 + now.get(java.util.Calendar.MINUTE)
        return if (start < end) {
            minutesNow in start until end
        } else {
            // Overnight schedule (e.g., 22:00 to 06:00)
            minutesNow >= start || minutesNow < end
        }
    }

    private fun isUsageLimitExceeded(packageName: String): Boolean {
    val prefs = applicationContext.getSharedPreferences("blocked_apps", Context.MODE_PRIVATE)
    val limit = prefs.getInt("limit_$packageName", 0)
    if (limit <= 0) return false // No limit set

    val usm = applicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
    val now = System.currentTimeMillis()
    val startOfDay = now - (now % (24 * 60 * 60 * 1000))

    val events = usm.queryEvents(startOfDay, now)
    var totalTime = 0L
    var lastStart = 0L

    val event = android.app.usage.UsageEvents.Event()
    while (events.hasNextEvent()) {
        events.getNextEvent(event)
        if (event.packageName == packageName) {
            when (event.eventType) {
                android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED -> {
                    lastStart = event.timeStamp
                }
                android.app.usage.UsageEvents.Event.ACTIVITY_PAUSED -> {
                    if (lastStart > 0) {
                        totalTime += (event.timeStamp - lastStart)
                        lastStart = 0
                    }
                }
            }
        }
    }

    val minutes = totalTime / (1000 * 60)
    return minutes >= limit
}


    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (!isBlockingEnabled() || !isWithinSchedule()) return
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

    val packageName = event.packageName?.toString() ?: return

    val blockedApps = getBlockedApps()
    if (blockedApps.contains(packageName)) {
        showBlockedScreen(packageName, "Always Blocked")
        return
    }

    if (isUsageLimitExceeded(packageName)) {
        showBlockedScreen(packageName, "Usage Limit Exceeded")
        return
    }
}

private fun showBlockedScreen(packageName: String, reason: String) {
    Log.d("AppBlockerService", "Blocked: $packageName -> $reason")
    val intent = Intent(this, BlockedActivity::class.java)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    intent.putExtra("APP_NAME", packageName)
    intent.putExtra("REASON", reason)
    startActivity(intent)
}


    override fun onInterrupt() {
         handler.removeCallbacks(checkRunnable)
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 100
        }
        serviceInfo = info
        handler.post(checkRunnable)
    }
}
