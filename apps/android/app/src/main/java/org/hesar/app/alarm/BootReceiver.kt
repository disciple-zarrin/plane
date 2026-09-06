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
 * Restores scheduled alarms when device boots or package is updated.
 * Invariant: MissedAlarmDueToDeviceReboot = 0
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            Log.i(TAG, "Boot or package update detected ($action). Rescheduling active future alarms...")

            val database = HesarDatabase.getInstance(context)
            val scheduler = AlarmScheduler(context)

            // Reschedule from local Room database
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val now = System.currentTimeMillis()
                    val activeFutureAlarms = database.alarmDao().getActiveFutureAlarms(now)
                    Log.i(TAG, "Found ${activeFutureAlarms.size} future alarms to restore")

                    for (alarm in activeFutureAlarms) {
                        scheduler.scheduleAlarm(alarm)
                    }
                    Log.i(TAG, "All active future alarms successfully restored after reboot")
                } catch (e: Exception) {
                    Log.e(TAG, "Error restoring alarms on boot", e)
                }
            }
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
}
