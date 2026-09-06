package org.hesar.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "issues",
    indices = [
        Index(value = ["workspaceId"]),
        Index(value = ["projectId"]),
        Index(value = ["projectIdentifier", "sequenceId"]),
        Index(value = ["stateId"]),
        Index(value = ["priority"])
    ]
)
data class IssueEntity(
    @PrimaryKey
    val id: String,
    val workspaceId: String,
    val projectId: String,
    val projectIdentifier: String,
    val sequenceId: Int,
    val name: String,
    val descriptionHtml: String?,
    val priority: String, // urgent, high, medium, low, none
    val stateId: String?,
    val stateName: String?,
    val stateGroup: String?, // backlog, unstarted, started, completed, cancelled
    val stateColor: String?,
    val assigneeIdsJson: String, // JSON array string
    val labelIdsJson: String, // JSON array string
    val targetDate: String?,
    val startDate: String?,
    val createdAt: String,
    val updatedAt: String,
    val lastSyncedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "issue_states",
    indices = [Index(value = ["projectId"])]
)
data class IssueStateEntity(
    @PrimaryKey
    val id: String,
    val projectId: String,
    val name: String,
    val color: String,
    val group: String,
    val sequence: Int
)

@Entity(
    tableName = "issue_labels",
    indices = [Index(value = ["projectId"])]
)
data class IssueLabelEntity(
    @PrimaryKey
    val id: String,
    val projectId: String,
    val name: String,
    val color: String
)

@Entity(
    tableName = "comments",
    indices = [Index(value = ["issueId"])]
)
data class CommentEntity(
    @PrimaryKey
    val id: String,
    val issueId: String,
    val actorId: String,
    val actorName: String,
    val actorAvatar: String?,
    val commentHtml: String,
    val createdAt: String,
    val updatedAt: String
)

@Entity(
    tableName = "worklogs",
    indices = [Index(value = ["issueId"])]
)
data class WorklogEntity(
    @PrimaryKey
    val id: String,
    val issueId: String,
    val actorId: String,
    val actorName: String,
    val durationMinutes: Int,
    val date: String,
    val description: String?,
    val createdAt: String
)
