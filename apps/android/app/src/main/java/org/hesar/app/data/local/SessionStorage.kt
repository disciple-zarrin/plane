package org.hesar.app.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.hesar.app.domain.model.User

class SessionStorage(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "hesar_secure_session_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val _isLoggedIn = MutableStateFlow(hasActiveSession())
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    private val _activeWorkspaceSlug = MutableStateFlow(getActiveWorkspaceSlug())
    val activeWorkspaceSlug: StateFlow<String?> = _activeWorkspaceSlug.asStateFlow()

    fun getSessionId(): String? {
        return prefs.getString(KEY_SESSION_ID, null)
    }

    fun hasActiveSession(): Boolean {
        val sessionId = getSessionId()
        return !sessionId.isNullOrBlank()
    }

    fun saveSession(
        sessionId: String,
        user: User,
        defaultWorkspaceSlug: String? = null
    ) {
        prefs.edit()
            .putString(KEY_SESSION_ID, sessionId)
            .putString(KEY_USER_ID, user.id)
            .putString(KEY_USER_EMAIL, user.email)
            .putString(KEY_USER_NAME, user.displayName)
            .putString(KEY_USER_AVATAR, user.avatarUrl)
            .apply()

        if (defaultWorkspaceSlug != null) {
            setActiveWorkspaceSlug(defaultWorkspaceSlug)
        }

        _isLoggedIn.value = true
    }

    fun getActiveWorkspaceSlug(): String? {
        return prefs.getString(KEY_ACTIVE_WORKSPACE_SLUG, null)
    }

    fun setActiveWorkspaceSlug(slug: String) {
        prefs.edit().putString(KEY_ACTIVE_WORKSPACE_SLUG, slug).apply()
        _activeWorkspaceSlug.value = slug
    }

    fun getCurrentUser(): User? {
        val id = prefs.getString(KEY_USER_ID, null) ?: return null
        val email = prefs.getString(KEY_USER_EMAIL, "") ?: ""
        val displayName = prefs.getString(KEY_USER_NAME, "") ?: ""
        val avatar = prefs.getString(KEY_USER_AVATAR, null)
        return User(
            id = id,
            email = email,
            firstName = "",
            lastName = "",
            displayName = displayName,
            avatarUrl = avatar
        )
    }

    fun setLastSyncedAt(timestamp: Long) {
        prefs.edit().putLong(KEY_LAST_SYNCED_AT, timestamp).apply()
    }

    fun getLastSyncedAt(): Long? {
        val time = prefs.getLong(KEY_LAST_SYNCED_AT, 0L)
        return if (time > 0L) time else null
    }

    fun getBackendBaseUrl(): String {
        return prefs.getString(KEY_BACKEND_URL, DEFAULT_BACKEND_URL) ?: DEFAULT_BACKEND_URL
    }

    fun setBackendBaseUrl(url: String) {
        prefs.edit().putString(KEY_BACKEND_URL, url).apply()
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_SESSION_ID)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_EMAIL)
            .remove(KEY_USER_NAME)
            .remove(KEY_USER_AVATAR)
            .remove(KEY_ACTIVE_WORKSPACE_SLUG)
            .remove(KEY_LAST_SYNCED_AT)
            .apply()

        _isLoggedIn.value = false
        _activeWorkspaceSlug.value = null
    }

    companion object {
        const val DEFAULT_BACKEND_URL = "https://board.disciple-zarrin.ir"
        private const val KEY_SESSION_ID = "session_id"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_AVATAR = "user_avatar"
        private const val KEY_ACTIVE_WORKSPACE_SLUG = "active_workspace_slug"
        private const val KEY_LAST_SYNCED_AT = "last_synced_at"
        private const val KEY_BACKEND_URL = "backend_base_url"

        @Volatile
        private var instance: SessionStorage? = null

        fun getInstance(context: Context): SessionStorage {
            return instance ?: synchronized(this) {
                instance ?: SessionStorage(context.applicationContext).also { instance = it }
            }
        }
    }
}
