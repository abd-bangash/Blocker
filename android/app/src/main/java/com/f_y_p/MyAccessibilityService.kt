package com.f_y_p

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.content.Context
import android.view.accessibility.AccessibilityEvent
import android.util.Log
import com.f_y_p.BlockedActivity

class AppBlockerService : AccessibilityService() {

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

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!isBlockingEnabled() || !isWithinSchedule()) return // <--- Only block if enabled and within schedule

        if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString()
            val blockedApps = getBlockedApps()
            Log.d("AppBlockerService", "onAccessibilityEvent: packageName=$packageName, blockedApps=$blockedApps")

            if (packageName != null && blockedApps.contains(packageName)) {
                Log.d("AppBlockerService", "Blocked: $packageName")
                val intent = Intent(this, BlockedActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                intent.putExtra("APP_NAME", packageName)
                startActivity(intent)
            }
        }
    }

    override fun onInterrupt() {}

    override fun onServiceConnected() {
        super.onServiceConnected()
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 100
        }
        serviceInfo = info
    }
}
