package org.hesar.app.data.repository

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import org.hesar.app.data.local.HesarDatabase
import org.hesar.app.data.local.entity.CommentEntity
import org.hesar.app.data.local.entity.IssueEntity
import org.hesar.app.data.local.entity.IssueLabelEntity
import org.hesar.app.data.local.entity.IssueStateEntity
import org.hesar.app.data.local.entity.SyncMetadataEntity
import org.hesar.app.data.remote.HesarApiService
import org.hesar.app.data.remote.dto.CreateCommentRequestDto
import org.hesar.app.data.remote.dto.CreateIssueRequestDto
import org.hesar.app.data.remote.dto.UpdateIssueRequestDto
import org.hesar.app.domain.gate.MutationCapabilityGate
import org.hesar.app.domain.model.Comment
import org.hesar.app.domain.model.Issue
import org.hesar.app.domain.model.IssueLabel
import org.hesar.app.domain.model.IssuePriority
import org.hesar.app.domain.model.IssueState
import org.hesar.app.domain.model.StateGroup

class IssueRepository(
    private val apiService: HesarApiService,
    private val database: HesarDatabase,
    private val mutationCapabilityGate: MutationCapabilityGate,
    private val gson: Gson = Gson()
) {
    private val listStringType = object : TypeToken<List<String>>() {}.type

    fun getIssuesFlow(projectId: String): Flow<List<Issue>> =
        database.issueDao().getIssuesByProjectFlow(projectId).map { entities ->
            entities.map { mapEntityToDomain(it) }
        }

    fun getIssueDetailFlow(issueId: String): Flow<Issue?> =
        database.issueDao().getIssueByIdFlow(issueId).map { entity ->
            entity?.let { mapEntityToDomain(it) }
        }

    fun searchIssuesFlow(query: String): Flow<List<Issue>> =
        database.issueDao().searchIssuesFlow(query).map { entities ->
            entities.map { mapEntityToDomain(it) }
        }

    fun getCommentsFlow(issueId: String): Flow<List<Comment>> =
        database.commentDao().getCommentsByIssueFlow(issueId).map { entities ->
            entities.map {
                Comment(
                    id = it.id,
                    issueId = it.issueId,
                    actorId = it.actorId,
                    actorName = it.actorName,
                    actorAvatar = it.actorAvatar,
                    commentHtml = it.commentHtml,
                    createdAt = it.createdAt,
                    updatedAt = it.updatedAt
                )
            }
        }

    fun getStatesFlow(projectId: String): Flow<List<IssueState>> =
        database.issueDao().getStatesByProjectFlow(projectId).map { entities ->
            entities.map {
                IssueState(
                    id = it.id,
                    projectId = it.projectId,
                    name = it.name,
                    color = it.color,
                    group = StateGroup.fromString(it.group),
                    sequence = it.sequence
                )
            }
        }

    fun getLabelsFlow(projectId: String): Flow<List<IssueLabel>> =
        database.issueDao().getLabelsByProjectFlow(projectId).map { entities ->
            entities.map {
                IssueLabel(
                    id = it.id,
                    projectId = it.projectId,
                    name = it.name,
                    color = it.color
                )
            }
        }

    fun getLastSyncedAtFlow(projectId: String): Flow<Long?> =
        database.syncMetadataDao().getMetadataFlow("issues_$projectId").map { it?.lastSyncedAt }

    // Remote Sync
    suspend fun syncIssues(
        workspaceSlug: String,
        workspaceId: String,
        projectId: String
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Sync states & labels first
            val statesResp = apiService.getStates(workspaceSlug, projectId)
            if (statesResp.isSuccessful && statesResp.body() != null) {
                val stateEntities = statesResp.body()!!.map {
                    IssueStateEntity(it.id, it.projectId, it.name, it.color, it.group, it.sequence)
                }
                database.issueDao().upsertStates(stateEntities)
            }

            val labelsResp = apiService.getLabels(workspaceSlug, projectId)
            if (labelsResp.isSuccessful && labelsResp.body() != null) {
                val labelEntities = labelsResp.body()!!.map {
                    IssueLabelEntity(it.id, it.projectId, it.name, it.color)
                }
                database.issueDao().upsertLabels(labelEntities)
            }

            // Sync issues
            val issuesResp = apiService.getIssues(workspaceSlug, projectId)
            if (issuesResp.isSuccessful && issuesResp.body() != null) {
                val issueDtos = issuesResp.body()!!
                val now = System.currentTimeMillis()
                val issueEntities = issueDtos.map { dto ->
                    IssueEntity(
                        id = dto.id,
                        workspaceId = workspaceId,
                        projectId = projectId,
                        projectIdentifier = dto.projectDetail?.identifier ?: "HESAR",
                        sequenceId = dto.sequenceId,
                        name = dto.name,
                        descriptionHtml = dto.descriptionHtml,
                        priority = dto.priority ?: "none",
                        stateId = dto.stateId,
                        stateName = dto.stateDetail?.name,
                        stateGroup = dto.stateDetail?.group,
                        stateColor = dto.stateDetail?.color,
                        assigneeIdsJson = gson.toJson(dto.assignees ?: emptyList<String>()),
                        labelIdsJson = gson.toJson(dto.labels ?: emptyList<String>()),
                        targetDate = dto.targetDate,
                        startDate = dto.startDate,
                        createdAt = dto.createdAt,
                        updatedAt = dto.updatedAt,
                        lastSyncedAt = now
                    )
                }

                database.issueDao().upsertIssues(issueEntities)
                database.issueDao().deleteIssuesNotIn(projectId, issueEntities.map { it.id })

                database.syncMetadataDao().setMetadata(
                    SyncMetadataEntity("issues_$projectId", now, issueEntities.size)
                )

                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to sync issues: ${issuesResp.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun syncComments(
        workspaceSlug: String,
        projectId: String,
        issueId: String
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val resp = apiService.getComments(workspaceSlug, projectId, issueId)
            if (resp.isSuccessful && resp.body() != null) {
                val commentDtos = resp.body()!!
                val entities = commentDtos.map { dto ->
                    CommentEntity(
                        id = dto.id,
                        issueId = issueId,
                        actorId = dto.actorId ?: "",
                        actorName = dto.actorDetail?.displayName ?: "",
                        actorAvatar = dto.actorDetail?.avatarUrl,
                        commentHtml = dto.commentHtml,
                        createdAt = dto.createdAt,
                        updatedAt = dto.updatedAt
                    )
                }
                database.commentDao().upsertComments(entities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to fetch comments: ${resp.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // --- MUTATIONS: CENTRAL WRITE GATE ENFORCED ---

    suspend fun createIssue(
        workspaceSlug: String,
        workspaceId: String,
        projectId: String,
        name: String,
        priority: IssuePriority = IssuePriority.NONE,
        stateId: String? = null,
        targetDate: String? = null,
        userRole: Int = 20
    ): Result<Issue> = withContext(Dispatchers.IO) {
        // HARD INVARIANT: Central write gate blocks offline mutations before any HTTP request
        mutationCapabilityGate.requireCanMutate(userRole)

        try {
            val response = apiService.createIssue(
                workspaceSlug,
                projectId,
                CreateIssueRequestDto(name, priority.value, stateId, targetDate)
            )
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                val entity = IssueEntity(
                    id = dto.id,
                    workspaceId = workspaceId,
                    projectId = projectId,
                    projectIdentifier = dto.projectDetail?.identifier ?: "HESAR",
                    sequenceId = dto.sequenceId,
                    name = dto.name,
                    descriptionHtml = dto.descriptionHtml,
                    priority = dto.priority ?: "none",
                    stateId = dto.stateId,
                    stateName = dto.stateDetail?.name,
                    stateGroup = dto.stateDetail?.group,
                    stateColor = dto.stateDetail?.color,
                    assigneeIdsJson = gson.toJson(dto.assignees ?: emptyList<String>()),
                    labelIdsJson = gson.toJson(dto.labels ?: emptyList<String>()),
                    targetDate = dto.targetDate,
                    startDate = dto.startDate,
                    createdAt = dto.createdAt,
                    updatedAt = dto.updatedAt,
                    lastSyncedAt = System.currentTimeMillis()
                )
                database.issueDao().upsertIssues(listOf(entity))
                Result.success(mapEntityToDomain(entity))
            } else {
                Result.failure(Exception("Failed to create issue: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateIssueState(
        workspaceSlug: String,
        projectId: String,
        issueId: String,
        newState: IssueState,
        userRole: Int = 20
    ): Result<Unit> = withContext(Dispatchers.IO) {
        // HARD INVARIANT: Gate enforcement
        mutationCapabilityGate.requireCanMutate(userRole)

        try {
            val response = apiService.updateIssue(
                workspaceSlug,
                projectId,
                issueId,
                UpdateIssueRequestDto(stateId = newState.id)
            )
            if (response.isSuccessful) {
                database.issueDao().updateIssueState(
                    issueId = issueId,
                    stateId = newState.id,
                    stateName = newState.name,
                    stateGroup = newState.group.value,
                    stateColor = newState.color
                )
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to update state: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateIssuePriority(
        workspaceSlug: String,
        projectId: String,
        issueId: String,
        newPriority: IssuePriority,
        userRole: Int = 20
    ): Result<Unit> = withContext(Dispatchers.IO) {
        // HARD INVARIANT: Gate enforcement
        mutationCapabilityGate.requireCanMutate(userRole)

        try {
            val response = apiService.updateIssue(
                workspaceSlug,
                projectId,
                issueId,
                UpdateIssueRequestDto(priority = newPriority.value)
            )
            if (response.isSuccessful) {
                database.issueDao().updateIssuePriority(issueId, newPriority.value)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to update priority: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addComment(
        workspaceSlug: String,
        projectId: String,
        issueId: String,
        commentHtml: String,
        userRole: Int = 20
    ): Result<Comment> = withContext(Dispatchers.IO) {
        // HARD INVARIANT: Gate enforcement
        mutationCapabilityGate.requireCanMutate(userRole)

        try {
            val response = apiService.createComment(
                workspaceSlug,
                projectId,
                issueId,
                CreateCommentRequestDto(commentHtml)
            )
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                val entity = CommentEntity(
                    id = dto.id,
                    issueId = issueId,
                    actorId = dto.actorId ?: "",
                    actorName = dto.actorDetail?.displayName ?: "",
                    actorAvatar = dto.actorDetail?.avatarUrl,
                    commentHtml = dto.commentHtml,
                    createdAt = dto.createdAt,
                    updatedAt = dto.updatedAt
                )
                database.commentDao().upsertComments(listOf(entity))
                Result.success(
                    Comment(
                        id = entity.id,
                        issueId = entity.issueId,
                        actorId = entity.actorId,
                        actorName = entity.actorName,
                        actorAvatar = entity.actorAvatar,
                        commentHtml = entity.commentHtml,
                        createdAt = entity.createdAt,
                        updatedAt = entity.updatedAt
                    )
                )
            } else {
                Result.failure(Exception("Failed to add comment: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun mapEntityToDomain(entity: IssueEntity): Issue {
        val assigneeIds: List<String> = try {
            gson.fromJson(entity.assigneeIdsJson, listStringType) ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
        val labelIds: List<String> = try {
            gson.fromJson(entity.labelIdsJson, listStringType) ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }

        return Issue(
            id = entity.id,
            workspaceId = entity.workspaceId,
            projectId = entity.projectId,
            projectIdentifier = entity.projectIdentifier,
            sequenceId = entity.sequenceId,
            name = entity.name,
            descriptionHtml = entity.descriptionHtml,
            priority = IssuePriority.fromString(entity.priority),
            stateId = entity.stateId,
            stateName = entity.stateName,
            stateGroup = entity.stateGroup?.let { StateGroup.fromString(it) },
            stateColor = entity.stateColor,
            assigneeIds = assigneeIds,
            labelIds = labelIds,
            targetDate = entity.targetDate,
            startDate = entity.startDate,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt,
            lastSyncedAt = entity.lastSyncedAt
        )
    }
}
