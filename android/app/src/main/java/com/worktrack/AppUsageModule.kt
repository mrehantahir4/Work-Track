package com.worktrack

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import java.util.*

class AppUsageModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppUsageModule"
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactContext.packageName
                )
            } else {
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactContext.packageName
                )
            }
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("CHECK_PERMISSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                data = Uri.parse("package:" + reactContext.packageName)
            }
            try {
                reactContext.startActivity(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                val genericIntent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(genericIntent)
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("OPEN_SETTINGS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getUsageStats(startTime: Double, endTime: Double, promise: Promise) {
        try {
            val startMillis = startTime.toLong()
            val endMillis = endTime.toLong()
            val usageStatsManager = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val pm = reactContext.packageManager

            val appUsageMap = mutableMapOf<String, Long>()
            val lastUsedMap = mutableMapOf<String, Long>()

            // 1. First attempt: Use UsageEvents for exact foreground time between startMillis and endMillis
            val events = usageStatsManager.queryEvents(startMillis, endMillis)
            val appStartMap = mutableMapOf<String, Long>()
            val event = UsageEvents.Event()

            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                val pkg = event.packageName ?: continue
                val eventType = event.eventType
                val timeStamp = event.timeStamp

                if (eventType == UsageEvents.Event.ACTIVITY_RESUMED || eventType == 1 /* MOVE_TO_FOREGROUND */) {
                    appStartMap[pkg] = timeStamp
                    lastUsedMap[pkg] = timeStamp
                } else if (eventType == UsageEvents.Event.ACTIVITY_PAUSED || eventType == 2 /* MOVE_TO_BACKGROUND */) {
                    val resumedTime = appStartMap[pkg]
                    if (resumedTime != null) {
                        val duration = timeStamp - resumedTime
                        if (duration > 0) {
                            appUsageMap[pkg] = (appUsageMap[pkg] ?: 0L) + duration
                        }
                        appStartMap.remove(pkg)
                    }
                    lastUsedMap[pkg] = timeStamp
                }
            }

            // Close any apps that were still in foreground when endMillis was reached
            for ((pkg, resumedTime) in appStartMap) {
                val duration = endMillis - resumedTime
                if (duration > 0) {
                    appUsageMap[pkg] = (appUsageMap[pkg] ?: 0L) + duration
                }
            }

            // 2. Fallback / supplementary: If UsageEvents didn't return anything (e.g. interval without events),
            // query UsageStats directly
            if (appUsageMap.isEmpty()) {
                val statsList: List<UsageStats>? = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_BEST,
                    startMillis,
                    endMillis
                )
                if (statsList != null) {
                    for (usage in statsList) {
                        val pkg = usage.packageName ?: continue
                        val fgTime = usage.totalTimeInForeground
                        if (fgTime > 0) {
                            appUsageMap[pkg] = (appUsageMap[pkg] ?: 0L) + fgTime
                            if (usage.lastTimeUsed > (lastUsedMap[pkg] ?: 0L)) {
                                lastUsedMap[pkg] = usage.lastTimeUsed
                            }
                        }
                    }
                }
            }

            val resultList = Arguments.createArray()

            // Filter out self app if needed or keep it, filter out 0 ms
            for ((pkg, timeMs) in appUsageMap) {
                if (timeMs < 500) continue // ignore below 0.5 sec jitter

                val map = Arguments.createMap()
                map.putString("packageName", pkg)
                map.putDouble("totalTimeForegroundMs", timeMs.toDouble())
                map.putDouble("lastTimeUsed", (lastUsedMap[pkg] ?: endMillis).toDouble())

                try {
                    val appInfo = pm.getApplicationInfo(pkg, 0)
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    map.putString("appName", appName)
                    map.putBoolean("isSystemApp", isSystem)
                } catch (e: Exception) {
                    // Fallback to prettified package name
                    val fallbackName = pkg.substringAfterLast(".").replaceFirstChar { it.uppercase() }
                    map.putString("appName", fallbackName)
                    map.putBoolean("isSystemApp", false)
                }

                resultList.pushMap(map)
            }

            promise.resolve(resultList)
        } catch (e: Exception) {
            promise.reject("GET_USAGE_ERROR", e.message)
        }
    }
}
