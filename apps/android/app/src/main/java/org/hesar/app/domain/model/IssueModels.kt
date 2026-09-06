package org.hesar.app.domain.model

enum class IssuePriority(val value: String, val faLabel: String, val enLabel: String) {
    URGENT("urgent", "فوری", "Urgent"),
    HIGH("high", "بالا", "High"),
    MEDIUM("medium", "متوسط", "Medium"),
    LOW("low", "پایین", "Low"),
    NONE("none", "هیچ", "None");

    companion object {
        fun fromString(str: String?): IssuePriority =
            entries.firstOrNull { it.value.equals(str, ignoreCase = true) } ?: NONE
    }
}

enum class StateGroup(val value: String, val faLabel: String, val enLabel: String) {
    BACKLOG("backlog", "بک‌لاگ", "Backlog"),
    UNSTARTED("unstarted", "شروع نشده", "Unstarted"),
    STARTED("started", "در حال انجام", "Started"),
    COMPLETED("completed", "انجام شد", "Completed"),
    CANCELLED("cancelled", "لغو شد", "Cancelled");

    companion object {
        fun fromString(str: String?): StateGroup =
            entries.firstOrNull { it.value.equals(str, ignoreCase = true) } ?: UNSTARTED
    }
}

data class IssueState(
    val id: String,
    val projectId: String,
    val name: String,
    val color: String,
    val group: StateGroup,
    val sequence: Int
)

data class IssueLabel(
    val id: String,
    val projectId: String,
    val name: String,
    val color: String
)

data class Issue(
    val id: String,
    val workspaceId: String,
    val projectId: String,
    val projectIdentifier: String,
    val sequenceId: Int,
    val name: String,
    val descriptionHtml: String?,
    val priority: IssuePriority,
    val stateId: String?,
    val stateName: String?,
    val stateGroup: StateGroup?,
    val stateColor: String?,
    val assigneeIds: List<String> = emptyList(),
    val labelIds: List<String> = emptyList(),
    val targetDate: String?, // ISO-8601 date (e.g. 2026-09-10)
    val startDate: String?,
    val createdAt: String,
    val updatedAt: String,
    val lastSyncedAt: Long = System.currentTimeMillis()
) {
    val displayKey: String
        get() = "$projectIdentifier-$sequenceId"
}

data class Comment(
    val id: String,
    val issueId: String,
    val actorId: String,
    val actorName: String,
    val actorAvatar: String?,
    val commentHtml: String,
    val createdAt: String,
    val updatedAt: String
)

data class Worklog(
    val id: String,
    val issueId: String,
    val actorId: String,
    val actorName: String,
    val durationMinutes: Int,
    val date: String,
    val description: String?,
    val createdAt: String
)
