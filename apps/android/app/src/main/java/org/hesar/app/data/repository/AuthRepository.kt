package org.hesar.app.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.hesar.app.data.local.HesarDatabase
import org.hesar.app.data.local.SessionStorage
import org.hesar.app.data.remote.HesarApiService
import org.hesar.app.data.remote.dto.SignInRequestDto
import org.hesar.app.domain.model.User

class AuthRepository(
    private val apiService: HesarApiService,
    private val database: HesarDatabase,
    private val sessionStorage: SessionStorage
) {
    suspend fun signIn(email: String, password: String): Result<User> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.signIn(SignInRequestDto(email, password))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                val userDto = body.user
                val user = User(
                    id = userDto.id,
                    email = userDto.email,
                    firstName = userDto.firstName ?: "",
                    lastName = userDto.lastName ?: "",
                    displayName = userDto.displayName ?: "${userDto.firstName} ${userDto.lastName}".trim(),
                    avatarUrl = userDto.avatarUrl,
                    isSuperuser = userDto.isSuperuser ?: false
                )

                // The session-id is captured by SessionInterceptor from Set-Cookie header.
                // If not yet persisted, set user session directly.
                val existingSession = sessionStorage.getSessionId() ?: "auth_session_${user.id}"
                sessionStorage.saveSession(
                    sessionId = existingSession,
                    user = user,
                    defaultWorkspaceSlug = body.defaultWorkspace
                )

                Result.success(user)
            } else {
                Result.failure(Exception("Authentication failed: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signOut() = withContext(Dispatchers.IO) {
        try {
            apiService.signOut()
        } catch (_: Exception) {
            // Ignore network errors during sign out
        } finally {
            // CRITICAL: Prevent cross-account data leaks. Clear session and all cached DB tables.
            sessionStorage.clearSession()
            database.clearProtectedUserData()
        }
    }

    fun getCurrentUser(): User? = sessionStorage.getCurrentUser()

    fun isLoggedIn(): Boolean = sessionStorage.hasActiveSession()
}
