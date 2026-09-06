package org.hesar.app.data.remote.dto

import com.google.gson.annotations.SerializedName

// Auth
data class SignInRequestDto(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class SignInResponseDto(
    @SerializedName("user") val user: UserDto,
    @SerializedName("default_workspace") val defaultWorkspace: String?
)

data class UserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("first_name") val firstName: String?,
    @SerializedName("last_name") val lastName: String?,
    @SerializedName("display_name") val displayName: String?,
    @SerializedName("avatar_url") val avatarUrl: String?,
    @SerializedName("is_superuser") val isSuperuser: Boolean?
)

// Workspace
data class WorkspaceDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("slug") val slug: String,
    @SerializedName("logo") val logo: String?,
    @SerializedName("total_projects") val totalProjects: Int?,
    @SerializedName("role") val role: Int?
)

// Project
data class ProjectDto(
    @SerializedName("id") val id: String,
    @SerializedName("workspace") val workspaceId: String,
    @SerializedName("name") val name: String,
    @SerializedName("identifier") val identifier: String,
    @SerializedName("description") val description: String?,
    @SerializedName("emoji") val emoji: String?,
    @SerializedName("icon") val icon: String?,
    @SerializedName("color") val color: String?,
    @SerializedName("total_issues") val totalIssues: Int?
)

// Issue
data class IssueDto(
    @SerializedName("id") val id: String,
    @SerializedName("workspace") val workspaceId: String,
    @SerializedName("project") val projectId: String,
    @SerializedName("project_detail") val projectDetail: ProjectDto? = null,
    @SerializedName("sequence_id") val sequenceId: Int,
    @SerializedName("name") val name: String,
    @SerializedName("description_html") val descriptionHtml: String?,
    @SerializedName("priority") val priority: String?,
    @SerializedName("state") val stateId: String?,
    @SerializedName("state_detail") val stateDetail: StateDto?,
    @SerializedName("assignees") val assignees: List<String>?,
    @SerializedName("labels") val labels: List<String>?,
    @SerializedName("target_date") val targetDate: String?,
    @SerializedName("start_date") val startDate: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

data class StateDto(
    @SerializedName("id") val id: String,
    @SerializedName("project") val projectId: String,
    @SerializedName("name") val name: String,
    @SerializedName("color") val color: String,
    @SerializedName("group") val group: String,
    @SerializedName("sequence") val sequence: Int
)

data class LabelDto(
    @SerializedName("id") val id: String,
    @SerializedName("project") val projectId: String,
    @SerializedName("name") val name: String,
    @SerializedName("color") val color: String
)

data class CommentDto(
    @SerializedName("id") val id: String,
    @SerializedName("issue") val issueId: String,
    @SerializedName("actor") val actorId: String?,
    @SerializedName("actor_detail") val actorDetail: UserDto?,
    @SerializedName("comment_html") val commentHtml: String,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

// Alarm DTO (matching existing Hesar backend MyPendingIssueAlarmsEndpoint)
data class AlarmDto(
    @SerializedName("id") val id: String,
    @SerializedName("user") val userId: String,
    @SerializedName("issue") val issueId: String,
    @SerializedName("issue_identifier") val issueIdentifier: String?,
    @SerializedName("issue_title") val issueTitle: String?,
    @SerializedName("scheduled_at") val scheduledAt: String,
    @SerializedName("hours_before") val hoursBefore: Int?,
    @SerializedName("alarm_type") val alarmType: String?,
    @SerializedName("is_triggered") val isTriggered: Boolean?,
    @SerializedName("is_cancelled") val isCancelled: Boolean?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

// Mutation Requests
data class CreateIssueRequestDto(
    @SerializedName("name") val name: String,
    @SerializedName("priority") val priority: String? = null,
    @SerializedName("state") val stateId: String? = null,
    @SerializedName("target_date") val targetDate: String? = null
)

data class UpdateIssueRequestDto(
    @SerializedName("name") val name: String? = null,
    @SerializedName("priority") val priority: String? = null,
    @SerializedName("state") val stateId: String? = null,
    @SerializedName("target_date") val targetDate: String? = null
)

data class CreateCommentRequestDto(
    @SerializedName("comment_html") val commentHtml: String
)

data class SetAlarmRequestDto(
    @SerializedName("scheduled_at") val scheduledAt: String? = null,
    @SerializedName("hours_before") val hoursBefore: Int? = null,
    @SerializedName("alarm_type") val alarmType: String? = "due_date"
)
