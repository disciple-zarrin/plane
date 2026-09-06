package org.hesar.app.data.remote

import org.hesar.app.data.remote.dto.AlarmDto
import org.hesar.app.data.remote.dto.CommentDto
import org.hesar.app.data.remote.dto.CreateCommentRequestDto
import org.hesar.app.data.remote.dto.CreateIssueRequestDto
import org.hesar.app.data.remote.dto.IssueDto
import org.hesar.app.data.remote.dto.LabelDto
import org.hesar.app.data.remote.dto.ProjectDto
import org.hesar.app.data.remote.dto.SetAlarmRequestDto
import org.hesar.app.data.remote.dto.SignInRequestDto
import org.hesar.app.data.remote.dto.SignInResponseDto
import org.hesar.app.data.remote.dto.StateDto
import org.hesar.app.data.remote.dto.UpdateIssueRequestDto
import org.hesar.app.data.remote.dto.UserDto
import org.hesar.app.data.remote.dto.WorkspaceDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface HesarApiService {

    // Auth
    @POST("/auth/sign-in/")
    suspend fun signIn(@Body request: SignInRequestDto): Response<SignInResponseDto>

    @POST("/auth/sign-out/")
    suspend fun signOut(): Response<Unit>

    @GET("/api/users/me/")
    suspend fun getCurrentUser(): Response<UserDto>

    // Workspaces
    @GET("/api/users/me/workspaces/")
    suspend fun getUserWorkspaces(): Response<List<WorkspaceDto>>

    // Projects
    @GET("/api/workspaces/{slug}/projects/")
    suspend fun getProjects(
        @Path("slug") workspaceSlug: String
    ): Response<List<ProjectDto>>

    // Issues
    @GET("/api/workspaces/{slug}/projects/{projectId}/issues/")
    suspend fun getIssues(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Query("cursor") cursor: String? = null
    ): Response<List<IssueDto>>

    @GET("/api/workspaces/{slug}/projects/{projectId}/issues/{issueId}/")
    suspend fun getIssueDetail(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Path("issueId") issueId: String
    ): Response<IssueDto>

    @POST("/api/workspaces/{slug}/projects/{projectId}/issues/")
    suspend fun createIssue(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Body request: CreateIssueRequestDto
    ): Response<IssueDto>

    @PATCH("/api/workspaces/{slug}/projects/{projectId}/issues/{issueId}/")
    suspend fun updateIssue(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Path("issueId") issueId: String,
        @Body request: UpdateIssueRequestDto
    ): Response<IssueDto>

    // States & Labels
    @GET("/api/workspaces/{slug}/projects/{projectId}/states/")
    suspend fun getStates(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String
    ): Response<List<StateDto>>

    @GET("/api/workspaces/{slug}/projects/{projectId}/issue-labels/")
    suspend fun getLabels(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String
    ): Response<List<LabelDto>>

    // Comments
    @GET("/api/workspaces/{slug}/projects/{projectId}/issues/{issueId}/comments/")
    suspend fun getComments(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Path("issueId") issueId: String
    ): Response<List<CommentDto>>

    @POST("/api/workspaces/{slug}/projects/{projectId}/issues/{issueId}/comments/")
    suspend fun createComment(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Path("issueId") issueId: String,
        @Body request: CreateCommentRequestDto
    ): Response<CommentDto>

    // Alarms (authoritative backend endpoints audited in Phase 0)
    @GET("/api/users/me/issue-alarms/")
    suspend fun getPendingAlarms(): Response<List<AlarmDto>>

    @GET("/api/workspaces/{slug}/projects/{projectId}/issues/{issueId}/my-alarm/")
    suspend fun getIssueAlarm(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Path("issueId") issueId: String
    ): Response<AlarmDto>

    @PUT("/api/workspaces/{slug}/projects/{projectId}/issues/{issueId}/my-alarm/")
    suspend fun setIssueAlarm(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Path("issueId") issueId: String,
        @Body request: SetAlarmRequestDto
    ): Response<AlarmDto>

    @DELETE("/api/workspaces/{slug}/projects/{projectId}/issues/{issueId}/my-alarm/")
    suspend fun deleteIssueAlarm(
        @Path("slug") workspaceSlug: String,
        @Path("projectId") projectId: String,
        @Path("issueId") issueId: String
    ): Response<Unit>
}
