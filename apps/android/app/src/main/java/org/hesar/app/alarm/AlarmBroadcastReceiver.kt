package org.hesar.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.hesar.app.data.local.HesarDatabase

class AlarmBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val alarmId = intent.getStringExtra(EXTRA_ALARM_ID) ?: return

        Log.i(TAG, "AlarmBroadcastReceiver received action=$action for alarmId=$alarmId")

        when (action) {
            ACTION_TRIGGER_ALARM -> handleTriggerAlarm(context, intent, alarmId)
            ACTION_STOP_ALARM -> handleStopAlarm(context, alarmId)
            ACTION_SNOOZE_ALARM -> {
                val minutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 10)
                handleSnoozeAlarm(context, alarmId, minutes)
            }
        }
    }

    private fun handleTriggerAlarm(context: Context, intent: Intent, alarmId: String) {
        // Acquire a partial wake lock to guarantee CPU stays awake during alert initiation
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "hesar:AlarmTriggerWakeLock"
        ).apply {
            setReferenceCounted(false)
            acquire(60_000L) // 60 seconds max
        }

        val issueId = intent.getStringExtra(EXTRA_ISSUE_ID) ?: ""
        val issueKey = intent.getStringExtra(EXTRA_ISSUE_KEY) ?: ""
        val issueTitle = intent.getStringExtra(EXTRA_ISSUE_TITLE) ?: ""

        // Start ringing and vibration
        AlarmAudioPlayer.start(context)

        // Show Heads-Up notification (Level B) and configure Full-Screen intent (Level A)
        val notifHelper = AlarmNotificationHelper(context)
        notifHelper.showAlarmNotification(alarmId, issueId, issueKey, issueTitle)

        // Launch full-screen ringing activity if device policy permits
        try {
            val activityIntent = Intent(context, AlarmRingingActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
                putExtra(EXTRA_ALARM_ID, alarmId)
                putExtra(EXTRA_ISSUE_ID, issueId)
                putExtra(EXTRA_ISSUE_KEY, issueKey)
                putExtra(EXTRA_ISSUE_TITLE, issueTitle)
            }
            context.startActivity(activityIntent)
        } catch (e: Exception) {
            Log.w(TAG, "Could not launch AlarmRingingActivity directly (falling back to notification): ${e.message}")
        }

        // Update Room status to TRIGGERED
        val database = HesarDatabase.getInstance(context)
        CoroutineScope(Dispatchers.IO).launch {
            database.alarmDao().updateAlarmStatus(alarmId, "TRIGGERED")
            wakeLock.release()
        }
    }

    private fun handleStopAlarm(context: Context, alarmId: String) {
        AlarmAudioPlayer.stop()
        AlarmNotificationHelper(context).cancelAlarmNotification(alarmId)

        val database = HesarDatabase.getInstance(context)
        CoroutineScope(Dispatchers.IO).launch {
            database.alarmDao().updateAlarmStatus(alarmId, "DISMISSED")
            Log.i(TAG, "Alarm $alarmId locally dismissed")
        }
    }

    private fun handleSnoozeAlarm(context: Context, alarmId: String, minutes: Int) {
        AlarmAudioPlayer.stop()
        AlarmNotificationHelper(context).cancelAlarmNotification(alarmId)

        val snoozeDurationMs = minutes * 60_000L
        val snoozeTargetTime = System.currentTimeMillis() + snoozeDurationMs

        val database = HesarDatabase.getInstance(context)
        val scheduler = AlarmScheduler(context)

        CoroutineScope(Dispatchers.IO).launch {
            val alarm = database.alarmDao().getAlarmById(alarmId)
            if (alarm != null) {
                val updated = alarm.copy(
                    localStatus = "SNOOZED",
                    snoozedUntilEpochMillis = snoozeTargetTime
                )
                database.alarmDao().updateAlarmStatus(alarmId, "SNOOZED", snoozeTargetTime)
                scheduler.scheduleAlarm(updated)
                Log.i(TAG, "Alarm $alarmId snoozed locally for $minutes minutes until $snoozeTargetTime")
            }
        }
    }

    companion object {
        const val TAG = "AlarmReceiver"
        const val ACTION_TRIGGER_ALARM = "org.hesar.app.ACTION_TRIGGER_ALARM"
        const val ACTION_STOP_ALARM = "org.hesar.app.ACTION_STOP_ALARM"
        const val ACTION_SNOOZE_ALARM = "org.hesar.app.ACTION_SNOOZE_ALARM"

        const val EXTRA_ALARM_ID = "extra_alarm_id"
        const val EXTRA_ISSUE_ID = "extra_issue_id"
        const val EXTRA_ISSUE_KEY = "extra_issue_key"
        const val EXTRA_ISSUE_TITLE = "extra_issue_title"
        const val EXTRA_SCHEDULED_AT = "extra_scheduled_at"
        const val EXTRA_SNOOZE_MINUTES = "extra_snooze_minutes"
    }
}
