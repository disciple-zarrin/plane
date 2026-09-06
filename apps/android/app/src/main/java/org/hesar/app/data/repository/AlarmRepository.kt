package org.hesar.app.data.repository

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import org.hesar.app.alarm.AlarmAudioPlayer
import org.hesar.app.alarm.AlarmNotificationHelper
import org.hesar.app.alarm.AlarmScheduler
import org.hesar.app.data.local.HesarDatabase
import org.hesar.app.data.local.entity.AlarmEntity
import org.hesar.app.data.local.entity.SyncMetadataEntity
import org.hesar.app.data.remote.HesarApiService
import org.hesar.app.domain.model.Alarm
import org.hesar.app.domain.model.LocalScheduleStatus
import java.time.Instant
import java.time.format.DateTimeFormatter

class AlarmRepository(
    private val context: Context,
    private val apiService: HesarApiService,
    private val database: HesarDatabase,
    private val scheduler: AlarmScheduler,
    private val notificationHelper: AlarmNotificationHelper
) {
    val alarmsFlow: Flow<List<Alarm>> = database.alarmDao().getAllAlarmsFlow().map { list ->
        list.map { mapEntityToDomain(it) }
    }

    val activeAlarmsFlow: Flow<List<Alarm>> = database.alarmDao().getActiveAlarmsFlow().map { list ->
        list.map { mapEntityToDomain(it) }
    }

    val activeAlarmCountFlow: Flow<Int> = database.alarmDao().getActiveAlarmCountFlow()

    suspend fun syncAlarms(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPendingAlarms()
            if (response.isSuccessful && response.body() != null) {
                val dtoList = response.body()!!
                val now = System.currentTimeMillis()

                val newEntities = dtoList.map { dto ->
                    val triggerMillis = parseIsoToEpochMillis(dto.scheduledAt)
                    AlarmEntity(
                        id = dto.id,
                        userId = dto.userId,
                        issueId = dto.issueId,
                        issueIdentifier = dto.issueIdentifier ?: "HESAR",
                        issueTitle = dto.issueTitle ?: "Untitled Issue",
                        scheduledAtUtc = dto.scheduledAt,
                        triggerEpochMillis = triggerMillis,
                        hoursBefore = dto.hoursBefore ?: 0,
                        alarmType = dto.alarmType ?: "due_date",
                        isTriggeredOnServer = dto.isTriggered ?: false,
                        isCancelledOnServer = dto.isCancelled ?: false,
                        localStatus = if (dto.isCancelled == true) "CANCELLED" else "SCHEDULED",
                        lastSyncedAt = now
                    )
                }

                // 1. Fetch existing alarms in Room to check for deletions or cancellations
                val existingAlarms = database.alarmDao().getActiveFutureAlarms(0)
                val newAlarmIds = newEntities.map { it.id }.toSet()

                // 2. Cancel local schedules for alarms deleted on server
                for (old in existingAlarms) {
                    if (old.id !in newAlarmIds || newEntities.find { it.id == old.id }?.isCancelledOnServer == true) {
                        scheduler.cancelAlarm(old.id)
                        Log.i(TAG, "Cancelled local schedule for deleted/cancelled server alarm ${old.id}")
                    }
                }

                // 3. Upsert into Room
                database.alarmDao().upsertAlarms(newEntities)
                database.alarmDao().deleteAlarmsNotIn(newEntities.map { it.id })

                // 4. Schedule active future alarms via AlarmManager
                val futureAlarms = database.alarmDao().getActiveFutureAlarms(now)
                for (alarm in futureAlarms) {
                    scheduler.scheduleAlarm(alarm)
                }

                database.syncMetadataDao().setMetadata(
                    SyncMetadataEntity("alarms_sync", now, futureAlarms.size)
                )

                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to sync alarms: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun stopAlarmLocally(alarmId: String) = withContext(Dispatchers.IO) {
        AlarmAudioPlayer.stop()
        notificationHelper.cancelAlarmNotification(alarmId)
        database.alarmDao().updateAlarmStatus(alarmId, "DISMISSED")
    }

    suspend fun snoozeAlarmLocally(alarmId: String, minutes: Int) = withContext(Dispatchers.IO) {
        AlarmAudioPlayer.stop()
        notificationHelper.cancelAlarmNotification(alarmId)

        val snoozeTarget = System.currentTimeMillis() + (minutes * 60_000L)
        val alarm = database.alarmDao().getAlarmById(alarmId)
        if (alarm != null) {
            val updated = alarm.copy(
                localStatus = "SNOOZED",
                snoozedUntilEpochMillis = snoozeTarget
            )
            database.alarmDao().updateAlarmStatus(alarmId, "SNOOZED", snoozeTarget)
            scheduler.scheduleAlarm(updated)
            Log.i(TAG, "Alarm $alarmId locally snoozed for $minutes minutes")
        }
    }

    fun canScheduleExactAlarms(): Boolean = scheduler.canScheduleExactAlarms()

    fun areNotificationsEnabled(): Boolean = notificationHelper.areNotificationsEnabled()

    private fun parseIsoToEpochMillis(isoString: String): Long {
        return try {
            Instant.parse(isoString).toEpochMilli()
        } catch (_: Exception) {
            try {
                // If offset format or missing Z
                DateTimeFormatter.ISO_DATE_TIME.parse(isoString, Instant::from).toEpochMilli()
            } catch (_: Exception) {
                System.currentTimeMillis()
            }
        }
    }

    private fun mapEntityToDomain(entity: AlarmEntity): Alarm {
        val status = try {
            LocalScheduleStatus.valueOf(entity.localStatus)
        } catch (_: Exception) {
            LocalScheduleStatus.SCHEDULED
        }
        return Alarm(
            id = entity.id,
            userId = entity.userId,
            issueId = entity.issueId,
            issueIdentifier = entity.issueIdentifier,
            issueTitle = entity.issueTitle,
            scheduledAtUtc = entity.scheduledAtUtc,
            triggerEpochMillis = entity.triggerEpochMillis,
            hoursBefore = entity.hoursBefore,
            alarmType = entity.alarmType,
            isTriggeredOnServer = entity.isTriggeredOnServer,
            isCancelledOnServer = entity.isCancelledOnServer,
            localScheduleStatus = status,
            snoozedUntilEpochMillis = entity.snoozedUntilEpochMillis,
            lastSyncedAt = entity.lastSyncedAt
        )
    }

    companion object {
        private const val TAG = "AlarmRepository"
    }
}
