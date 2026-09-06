package org.hesar.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "alarms",
    indices = [
        Index(value = ["issueId"]),
        Index(value = ["userId"]),
        Index(value = ["triggerEpochMillis"]),
        Index(value = ["localStatus"])
    ]
)
data class AlarmEntity(
    @PrimaryKey
    val id: String, // Server alarm UUID
    val userId: String,
    val issueId: String,
    val issueIdentifier: String, // e.g. "HES-42"
    val issueTitle: String,
    val scheduledAtUtc: String, // Canonical ISO-8601 UTC timestamp
    val triggerEpochMillis: Long, // Canonical epoch millis for AlarmManager trigger
    val hoursBefore: Int = 0,
    val alarmType: String = "due_date",
    val isTriggeredOnServer: Boolean = false,
    val isCancelledOnServer: Boolean = false,
    val localStatus: String = "SCHEDULED", // SCHEDULED, TRIGGERED, SNOOZED, DISMISSED, CANCELLED
    val snoozedUntilEpochMillis: Long? = null,
    val lastSyncedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "sync_metadata")
data class SyncMetadataEntity(
    @PrimaryKey
    val syncKey: String, // e.g. "issues_<project_id>", "alarms_<user_id>"
    val lastSyncedAt: Long,
    val recordCount: Int = 0
)
