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

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString()
            val blockedApps = getBlockedApps() // dynamic list
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
