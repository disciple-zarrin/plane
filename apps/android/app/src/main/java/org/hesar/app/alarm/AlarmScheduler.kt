package org.hesar.app.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.hesar.app.data.local.entity.AlarmEntity
import org.hesar.app.ui.MainActivity

class AlarmScheduler(private val context: Context) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun canScheduleExactAlarms(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }
    }

    fun scheduleAlarm(alarm: AlarmEntity) {
        val triggerTime = if (alarm.localStatus == "SNOOZED" && alarm.snoozedUntilEpochMillis != null) {
            alarm.snoozedUntilEpochMillis
        } else {
            alarm.triggerEpochMillis
        }

        val now = System.currentTimeMillis()
        if (triggerTime <= now) {
            Log.d(TAG, "Alarm ${alarm.id} is in the past ($triggerTime <= $now), skipping scheduling")
            return
        }

        val intent = Intent(context, AlarmBroadcastReceiver::class.java).apply {
            action = AlarmBroadcastReceiver.ACTION_TRIGGER_ALARM
            putExtra(AlarmBroadcastReceiver.EXTRA_ALARM_ID, alarm.id)
            putExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_ID, alarm.issueId)
            putExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_KEY, alarm.issueIdentifier)
            putExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_TITLE, alarm.issueTitle)
            putExtra(AlarmBroadcastReceiver.EXTRA_SCHEDULED_AT, alarm.scheduledAtUtc)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarm.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Show intent for AlarmClockInfo: opens app on click
        val showIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route_issue_id", alarm.issueId)
        }
        val showPendingIntent = PendingIntent.getActivity(
            context,
            alarm.id.hashCode(),
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (canScheduleExactAlarms()) {
                val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerTime, showPendingIntent)
                alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
                Log.i(TAG, "Scheduled exact AlarmClock for ${alarm.issueIdentifier} at $triggerTime")
            } else {
                // Fallback for devices where exact alarm permission is missing
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                Log.w(TAG, "Exact alarm permission missing. Scheduled inexact alarm for ${alarm.issueIdentifier}")
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException while scheduling exact alarm for ${alarm.id}", e)
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
        }
    }

    fun cancelAlarm(alarmId: String) {
        val intent = Intent(context, AlarmBroadcastReceiver::class.java).apply {
            action = AlarmBroadcastReceiver.ACTION_TRIGGER_ALARM
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId.hashCode(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
            Log.i(TAG, "Cancelled AlarmManager PendingIntent for $alarmId")
        }
    }

    companion object {
        private const val TAG = "AlarmScheduler"
    }
}
