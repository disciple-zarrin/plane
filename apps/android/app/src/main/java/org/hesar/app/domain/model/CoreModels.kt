package org.hesar.app.domain.model

data class User(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val displayName: String,
    val avatarUrl: String?,
    val isSuperuser: Boolean = false
)

data class Workspace(
    val id: String,
    val name: String,
    val slug: String,
    val logo: String?,
    val role: Int = 20, // 20: Admin, 15: Member, 5: Guest
    val totalProjects: Int = 0
)

data class Project(
    val id: String,
    val workspaceId: String,
    val name: String,
    val identifier: String,
    val description: String?,
    val emoji: String?,
    val icon: String?,
    val color: String?,
    val totalIssues: Int = 0
)
