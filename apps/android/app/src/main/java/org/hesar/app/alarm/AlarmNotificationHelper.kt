package org.hesar.app.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import org.hesar.app.R
import org.hesar.app.ui.MainActivity

class AlarmNotificationHelper(private val context: Context) {

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    init {
        createChannels()
    }

    private fun createChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            // 1. Alarms Channel (HIGH importance, full screen, heads-up)
            val alarmsChannel = NotificationChannel(
                CHANNEL_ID_ALARMS,
                context.getString(R.string.alarm_channel_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = context.getString(R.string.alarm_channel_desc)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 600, 600, 600)
                setSound(alarmSound, audioAttributes)
                setBypassDnd(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            // 2. Notifications Channel (DEFAULT importance)
            val notifChannel = NotificationChannel(
                CHANNEL_ID_NOTIFICATIONS,
                context.getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = context.getString(R.string.notification_channel_desc)
            }

            // 3. Background Sync Channel (LOW importance, silent)
            val syncChannel = NotificationChannel(
                CHANNEL_ID_SYNC,
                context.getString(R.string.sync_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = context.getString(R.string.sync_channel_desc)
            }

            notificationManager.createNotificationChannels(listOf(alarmsChannel, notifChannel, syncChannel))
        }
    }

    fun showAlarmNotification(
        alarmId: String,
        issueId: String,
        issueKey: String,
        issueTitle: String
    ) {
        val notifId = alarmId.hashCode()

        // Content intent (tap on notification opens Issue in app)
        val contentIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route_issue_id", issueId)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            notifId,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Full-screen Intent (Level A ringing screen)
        val fullScreenIntent = Intent(context, AlarmRingingActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(AlarmBroadcastReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_ID, issueId)
            putExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_KEY, issueKey)
            putExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_TITLE, issueTitle)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            notifId + 1,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Stop
        val stopIntent = Intent(context, AlarmBroadcastReceiver::class.java).apply {
            action = AlarmBroadcastReceiver.ACTION_STOP_ALARM
            putExtra(AlarmBroadcastReceiver.EXTRA_ALARM_ID, alarmId)
        }
        val stopPendingIntent = PendingIntent.getBroadcast(
            context,
            notifId + 2,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Snooze 10 minutes
        val snoozeIntent = Intent(context, AlarmBroadcastReceiver::class.java).apply {
            action = AlarmBroadcastReceiver.ACTION_SNOOZE_ALARM
            putExtra(AlarmBroadcastReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmBroadcastReceiver.EXTRA_SNOOZE_MINUTES, 10)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            notifId + 3,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID_ALARMS)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("⏰ $issueKey: $issueTitle")
            .setContentText(context.getString(R.string.alarm_channel_name))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(contentPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setAutoCancel(false)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                context.getString(R.string.alarm_stop),
                stopPendingIntent
            )
            .addAction(
                android.R.drawable.ic_popup_reminder,
                context.getString(R.string.alarm_snooze) + " (۱۰ د)",
                snoozePendingIntent
            )
            .build()

        notificationManager.notify(notifId, notification)
    }

    fun cancelAlarmNotification(alarmId: String) {
        notificationManager.cancel(alarmId.hashCode())
    }

    fun areNotificationsEnabled(): Boolean {
        return notificationManager.areNotificationsEnabled()
    }

    companion object {
        const val CHANNEL_ID_ALARMS = "hesar_alarms"
        const val CHANNEL_ID_NOTIFICATIONS = "hesar_notifications"
        const val CHANNEL_ID_SYNC = "hesar_sync"
    }
}
