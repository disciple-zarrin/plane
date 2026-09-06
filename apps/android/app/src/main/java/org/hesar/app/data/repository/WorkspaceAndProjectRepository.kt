package org.hesar.app.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import org.hesar.app.data.local.HesarDatabase
import org.hesar.app.data.local.entity.ProjectEntity
import org.hesar.app.data.local.entity.WorkspaceEntity
import org.hesar.app.data.remote.HesarApiService
import org.hesar.app.domain.model.Project
import org.hesar.app.domain.model.Workspace

class WorkspaceRepository(
    private val apiService: HesarApiService,
    private val database: HesarDatabase
) {
    val workspacesFlow: Flow<List<Workspace>> = database.workspaceDao().getWorkspacesFlow().map { entities ->
        entities.map { entity ->
            Workspace(
                id = entity.id,
                name = entity.name,
                slug = entity.slug,
                logo = entity.logo,
                role = entity.role,
                totalProjects = entity.totalProjects
            )
        }
    }

    suspend fun syncWorkspaces(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUserWorkspaces()
            if (response.isSuccessful && response.body() != null) {
                val dtoList = response.body()!!
                val entities = dtoList.map { dto ->
                    WorkspaceEntity(
                        id = dto.id,
                        name = dto.name,
                        slug = dto.slug,
                        logo = dto.logo,
                        role = dto.role ?: 20,
                        totalProjects = dto.totalProjects ?: 0,
                        lastSyncedAt = System.currentTimeMillis()
                    )
                }
                database.workspaceDao().upsertWorkspaces(entities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to fetch workspaces: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class ProjectRepository(
    private val apiService: HesarApiService,
    private val database: HesarDatabase
) {
    fun getProjectsFlow(workspaceId: String): Flow<List<Project>> =
        database.projectDao().getProjectsByWorkspaceFlow(workspaceId).map { entities ->
            entities.map { entity ->
                Project(
                    id = entity.id,
                    workspaceId = entity.workspaceId,
                    name = entity.name,
                    identifier = entity.identifier,
                    description = entity.description,
                    emoji = entity.emoji,
                    icon = entity.icon,
                    color = entity.color,
                    totalIssues = entity.totalIssues
                )
            }
        }

    suspend fun syncProjects(workspaceSlug: String, workspaceId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getProjects(workspaceSlug)
            if (response.isSuccessful && response.body() != null) {
                val dtoList = response.body()!!
                val entities = dtoList.map { dto ->
                    ProjectEntity(
                        id = dto.id,
                        workspaceId = workspaceId,
                        name = dto.name,
                        identifier = dto.identifier,
                        description = dto.description,
                        emoji = dto.emoji,
                        icon = dto.icon,
                        color = dto.color,
                        totalIssues = dto.totalIssues ?: 0,
                        lastSyncedAt = System.currentTimeMillis()
                    )
                }
                database.projectDao().upsertProjects(entities)
                val validIds = entities.map { it.id }
                database.projectDao().deleteProjectsNotIn(workspaceId, validIds)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to fetch projects: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
