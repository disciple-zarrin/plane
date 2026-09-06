package org.hesar.app.domain.model

/**
 * Represents whether the user is permitted to perform domain mutations
 * (creating/editing/deleting issues, changing state/priority, adding comments, etc.).
 *
 * Enforced by MutationCapabilityGate.
 */
sealed interface MutationCapability {
    /**
     * Device is online with valid active session and user has write permissions.
     */
    data object Allowed : MutationCapability

    /**
     * Device is offline (or backend unreachable). Cached data is readable,
     * but ALL domain mutations are strictly forbidden.
     * Invariant: OfflineDomainMutationRequests = 0.
     */
    data class OfflineReadOnly(val lastSyncedAt: Long? = null) : MutationCapability

    /**
     * User session is missing or expired.
     */
    data object SessionExpired : MutationCapability

    /**
     * User lacks permission for this action on the workspace/project.
     */
    data class PermissionDenied(val reason: String = "Permission denied") : MutationCapability

    val isMutationAllowed: Boolean
        get() = this is Allowed
}

class OfflineMutationForbiddenException(message: String = "Domain mutation forbidden while offline. OfflineDomainMutationRequests must be 0.") :
    IllegalStateException(message)

class SessionExpiredException(message: String = "Cannot mutate while session is expired.") :
    IllegalStateException(message)

class PermissionDeniedException(message: String = "Permission denied.") :
    IllegalStateException(message)
