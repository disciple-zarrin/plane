package org.hesar.app.domain.model

data class Alarm(
    val id: String, // Server alarm UUID
    val userId: String,
    val issueId: String,
    val issueIdentifier: String, // e.g. "HES-42"
    val issueTitle: String,
    val scheduledAtUtc: String, // Canonical ISO-8601 UTC timestamp
    val triggerEpochMillis: Long, // Exact epoch millis calculated for device trigger
    val hoursBefore: Int = 0,
    val alarmType: String = "due_date",
    val isTriggeredOnServer: Boolean = false,
    val isCancelledOnServer: Boolean = false,
    val localScheduleStatus: LocalScheduleStatus = LocalScheduleStatus.SCHEDULED,
    val snoozedUntilEpochMillis: Long? = null,
    val lastSyncedAt: Long = System.currentTimeMillis()
)

enum class LocalScheduleStatus {
    SCHEDULED,
    TRIGGERED,
    SNOOZED,
    DISMISSED,
    CANCELLED
}
