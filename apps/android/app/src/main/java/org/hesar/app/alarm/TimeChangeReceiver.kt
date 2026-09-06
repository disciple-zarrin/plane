package org.hesar.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.hesar.app.data.local.HesarDatabase

/**
 * Handles system time change (ACTION_TIME_SET) or timezone change (ACTION_TIMEZONE_CHANGED)
 * and verifies that future alarms are accurately rescheduled against the updated clock.
 */
class TimeChangeReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == Intent.ACTION_TIME_CHANGED ||
            action == Intent.ACTION_TIMEZONE_CHANGED
        ) {
            Log.i(TAG, "Device clock or timezone changed ($action). Rescheduling future alarms...")

            val database = HesarDatabase.getInstance(context)
            val scheduler = AlarmScheduler(context)

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val now = System.currentTimeMillis()
                    val activeFutureAlarms = database.alarmDao().getActiveFutureAlarms(now)
                    Log.i(TAG, "Re-verifying ${activeFutureAlarms.size} future alarms after time/timezone change")

                    for (alarm in activeFutureAlarms) {
                        scheduler.scheduleAlarm(alarm)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error rescheduling alarms after time change", e)
                }
            }
        }
    }

    companion object {
        private const val TAG = "TimeChangeReceiver"
    }
}
