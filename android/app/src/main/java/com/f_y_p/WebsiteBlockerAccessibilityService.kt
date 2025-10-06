package com.f_y_p

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Handler
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.util.*

class BlockerAccessibilityService : AccessibilityService() {

    private lateinit var appPrefs: SharedPreferences
    private lateinit var sitePrefs: SharedPreferences
    private val handler = Handler()

    private val checkRunnable = object : Runnable {
        override fun run() {
            if (isBlockingEnabled() && isWithinSchedule()) {
                val packageName = rootInActiveWindow?.packageName?.toString()
                val blockedApps = getBlockedApps()
                if (packageName != null && blockedApps.contains(packageName)) {
                    if (isUsageLimitExceeded(packageName)) {
                        showBlockedScreen(packageName, "Usage Limit Exceeded")
                    } else {
                        showBlockedScreen(packageName, "Always Blocked")
                    }
                }
            }
            handler.postDelayed(this, 5000) // every 5 sec
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        appPrefs = getSharedPreferences("blocked_apps", Context.MODE_PRIVATE)
        sitePrefs = getSharedPreferences("BlockerPrefs", Context.MODE_PRIVATE)

        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 100
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
        }
        serviceInfo = info

        handler.post(checkRunnable)
        Log.d("BlockerService", "Accessibility Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (!isBlockingEnabled() || !isWithinSchedule()) return

        val packageName = event.packageName?.toString() ?: return

        // --- Website Blocking ---
        val blockedSites = sitePrefs.getStringSet("blocked_websites", HashSet()) ?: HashSet()
        if (packageName.contains("chrome") || packageName.contains("firefox") || packageName.contains("opera")) {
            val url = getUrlFromBrowser(event.source)
            if (url != null) {
                for (site in blockedSites) {
                    if (url.contains(site, ignoreCase = true)) {
                        Log.d("BlockerService", "Website BLOCKED: $url")
                        showWebsiteBlocked(url)
                        return
                    }
                }
            }
        }

        // --- App Blocking ---
        val blockedApps = getBlockedApps()
        if (blockedApps.contains(packageName)) {
            if (isUsageLimitExceeded(packageName)) {
                showBlockedScreen(packageName, "Usage Limit Exceeded")
            } else {
                showBlockedScreen(packageName, "Always Blocked")
            }
        }
    }

    override fun onInterrupt() {
        handler.removeCallbacks(checkRunnable)
    }

    // ---------------- APP BLOCKING ----------------
    private fun getBlockedApps(): List<String> {
        val savedApps = appPrefs.getStringSet("apps", emptySet()) ?: emptySet()
        return savedApps.toList()
    }

    private fun isBlockingEnabled(): Boolean {
        return appPrefs.getBoolean("blocking_enabled", true)
    }

    private fun isWithinSchedule(): Boolean {
        val start = appPrefs.getInt("block_start", -1)
        val end = appPrefs.getInt("block_end", -1)
        if (start == -1 || end == -1) return true

        val now = Calendar.getInstance()
        val minutesNow = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
        return if (start < end) {
            minutesNow in start until end
        } else {
            minutesNow >= start || minutesNow < end
        }
    }

    private fun isUsageLimitExceeded(packageName: String): Boolean {
        val limit = appPrefs.getInt("limit_$packageName", 0)
        if (limit <= 0) return false

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
                    android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED -> lastStart = event.timeStamp
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

    // ---------------- WEBSITE BLOCKING ----------------
    private fun getUrlFromBrowser(rootNode: AccessibilityNodeInfo?): String? {
        if (rootNode == null) return null

        val chromeUrl = rootNode.findAccessibilityNodeInfosByViewId("com.android.chrome:id/url_bar")
        if (!chromeUrl.isNullOrEmpty()) return chromeUrl[0].text?.toString()

        val firefoxUrl = rootNode.findAccessibilityNodeInfosByViewId("org.mozilla.firefox:id/url_bar")
        if (!firefoxUrl.isNullOrEmpty()) return firefoxUrl[0].text?.toString()

        return null
    }

    private fun showWebsiteBlocked(url: String) {
        val intent = Intent(this, BlockedActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        intent.putExtra("WEBSITE_URL", url)
        startActivity(intent)
    }

    private fun showBlockedScreen(packageName: String, reason: String) {
        Log.d("BlockerService", "Blocked: $packageName -> $reason")
        val intent = Intent(this, BlockedActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        intent.putExtra("APP_NAME", packageName)
        intent.putExtra("REASON", reason)
        startActivity(intent)
    }
}
