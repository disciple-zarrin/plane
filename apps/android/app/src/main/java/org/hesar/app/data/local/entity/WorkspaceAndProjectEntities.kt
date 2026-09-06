package org.hesar.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "workspaces",
    indices = [Index(value = ["slug"], unique = true)]
)
data class WorkspaceEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val slug: String,
    val logo: String?,
    val role: Int,
    val totalProjects: Int,
    val lastSyncedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "projects",
    indices = [
        Index(value = ["workspaceId"]),
        Index(value = ["identifier"])
    ]
)
data class ProjectEntity(
    @PrimaryKey
    val id: String,
    val workspaceId: String,
    val name: String,
    val identifier: String,
    val description: String?,
    val emoji: String?,
    val icon: String?,
    val color: String?,
    val totalIssues: Int,
    val lastSyncedAt: Long = System.currentTimeMillis()
)
