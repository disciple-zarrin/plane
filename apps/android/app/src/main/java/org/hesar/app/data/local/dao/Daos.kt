package org.hesar.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow
import org.hesar.app.data.local.entity.AlarmEntity
import org.hesar.app.data.local.entity.CommentEntity
import org.hesar.app.data.local.entity.IssueEntity
import org.hesar.app.data.local.entity.IssueLabelEntity
import org.hesar.app.data.local.entity.IssueStateEntity
import org.hesar.app.data.local.entity.ProjectEntity
import org.hesar.app.data.local.entity.SyncMetadataEntity
import org.hesar.app.data.local.entity.WorkspaceEntity

@Dao
interface WorkspaceDao {
    @Query("SELECT * FROM workspaces ORDER BY name ASC")
    fun getWorkspacesFlow(): Flow<List<WorkspaceEntity>>

    @Query("SELECT * FROM workspaces WHERE slug = :slug LIMIT 1")
    fun getWorkspaceBySlugFlow(slug: String): Flow<WorkspaceEntity?>

    @Query("SELECT * FROM workspaces WHERE id = :id LIMIT 1")
    suspend fun getWorkspaceById(id: String): WorkspaceEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWorkspaces(workspaces: List<WorkspaceEntity>)

    @Query("DELETE FROM workspaces")
    suspend fun clearAll()
}

@Dao
interface ProjectDao {
    @Query("SELECT * FROM projects WHERE workspaceId = :workspaceId ORDER BY name ASC")
    fun getProjectsByWorkspaceFlow(workspaceId: String): Flow<List<ProjectEntity>>

    @Query("SELECT * FROM projects WHERE id = :projectId LIMIT 1")
    fun getProjectByIdFlow(projectId: String): Flow<ProjectEntity?>

    @Query("SELECT * FROM projects WHERE id = :projectId LIMIT 1")
    suspend fun getProjectById(projectId: String): ProjectEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProjects(projects: List<ProjectEntity>)

    @Query("DELETE FROM projects WHERE workspaceId = :workspaceId AND id NOT IN (:validIds)")
    suspend fun deleteProjectsNotIn(workspaceId: String, validIds: List<String>)

    @Query("DELETE FROM projects")
    suspend fun clearAll()
}

@Dao
interface IssueDao {
    @Query("SELECT * FROM issues WHERE projectId = :projectId ORDER BY sequenceId DESC")
    fun getIssuesByProjectFlow(projectId: String): Flow<List<IssueEntity>>

    @Query("SELECT * FROM issues WHERE id = :issueId LIMIT 1")
    fun getIssueByIdFlow(issueId: String): Flow<IssueEntity?>

    @Query("SELECT * FROM issues WHERE id = :issueId LIMIT 1")
    suspend fun getIssueById(issueId: String): IssueEntity?

    @Query("SELECT * FROM issues WHERE name LIKE '%' || :query || '%' OR projectIdentifier || '-' || sequenceId LIKE '%' || :query || '%' ORDER BY sequenceId DESC LIMIT 50")
    fun searchIssuesFlow(query: String): Flow<List<IssueEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertIssues(issues: List<IssueEntity>)

    @Query("DELETE FROM issues WHERE projectId = :projectId AND id NOT IN (:validIds)")
    suspend fun deleteIssuesNotIn(projectId: String, validIds: List<String>)

    @Query("UPDATE issues SET stateId = :stateId, stateName = :stateName, stateGroup = :stateGroup, stateColor = :stateColor WHERE id = :issueId")
    suspend fun updateIssueState(issueId: String, stateId: String, stateName: String, stateGroup: String, stateColor: String)

    @Query("UPDATE issues SET priority = :priority WHERE id = :issueId")
    suspend fun updateIssuePriority(issueId: String, priority: String)

    @Query("DELETE FROM issues")
    suspend fun clearAll()

    // States
    @Query("SELECT * FROM issue_states WHERE projectId = :projectId ORDER BY sequence ASC")
    fun getStatesByProjectFlow(projectId: String): Flow<List<IssueStateEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertStates(states: List<IssueStateEntity>)

    // Labels
    @Query("SELECT * FROM issue_labels WHERE projectId = :projectId ORDER BY name ASC")
    fun getLabelsByProjectFlow(projectId: String): Flow<List<IssueLabelEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertLabels(labels: List<IssueLabelEntity>)
}

@Dao
interface CommentDao {
    @Query("SELECT * FROM comments WHERE issueId = :issueId ORDER BY createdAt ASC")
    fun getCommentsByIssueFlow(issueId: String): Flow<List<CommentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertComments(comments: List<CommentEntity>)

    @Query("DELETE FROM comments WHERE issueId = :issueId")
    suspend fun deleteCommentsForIssue(issueId: String)

    @Query("DELETE FROM comments")
    suspend fun clearAll()
}

@Dao
interface AlarmDao {
    @Query("SELECT * FROM alarms ORDER BY triggerEpochMillis ASC")
    fun getAllAlarmsFlow(): Flow<List<AlarmEntity>>

    @Query("SELECT * FROM alarms WHERE isCancelledOnServer = 0 AND localStatus != 'CANCELLED' ORDER BY triggerEpochMillis ASC")
    fun getActiveAlarmsFlow(): Flow<List<AlarmEntity>>

    @Query("SELECT * FROM alarms WHERE id = :id LIMIT 1")
    suspend fun getAlarmById(id: String): AlarmEntity?

    @Query("SELECT * FROM alarms WHERE isCancelledOnServer = 0 AND localStatus IN ('SCHEDULED', 'SNOOZED') AND (triggerEpochMillis > :currentTimeMillis OR (snoozedUntilEpochMillis IS NOT NULL AND snoozedUntilEpochMillis > :currentTimeMillis))")
    suspend fun getActiveFutureAlarms(currentTimeMillis: Long): List<AlarmEntity>

    @Query("SELECT COUNT(*) FROM alarms WHERE isCancelledOnServer = 0 AND localStatus IN ('SCHEDULED', 'SNOOZED')")
    fun getActiveAlarmCountFlow(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAlarms(alarms: List<AlarmEntity>)

    @Query("UPDATE alarms SET localStatus = :status, snoozedUntilEpochMillis = :snoozeUntil WHERE id = :id")
    suspend fun updateAlarmStatus(id: String, status: String, snoozeUntil: Long? = null)

    @Query("DELETE FROM alarms WHERE id = :id")
    suspend fun deleteAlarm(id: String)

    @Query("DELETE FROM alarms WHERE id NOT IN (:validIds)")
    suspend fun deleteAlarmsNotIn(validIds: List<String>)

    @Query("DELETE FROM alarms")
    suspend fun clearAll()
}

@Dao
interface SyncMetadataDao {
    @Query("SELECT * FROM sync_metadata WHERE syncKey = :key LIMIT 1")
    fun getMetadataFlow(key: String): Flow<SyncMetadataEntity?>

    @Query("SELECT * FROM sync_metadata WHERE syncKey = :key LIMIT 1")
    suspend fun getMetadata(key: String): SyncMetadataEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setMetadata(metadata: SyncMetadataEntity)

    @Query("DELETE FROM sync_metadata")
    suspend fun clearAll()
}
