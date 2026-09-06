package org.hesar.app.domain.gate

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import org.hesar.app.data.local.SessionStorage
import org.hesar.app.domain.model.ConnectivityState
import org.hesar.app.domain.model.MutationCapability
import org.hesar.app.domain.model.OfflineMutationForbiddenException
import org.hesar.app.domain.model.PermissionDeniedException
import org.hesar.app.domain.model.SessionExpiredException

/**
 * Authoritative Central Write Gate.
 *
 * Combines ConnectivityState, SessionState, and PermissionState into MutationCapability.
 * Every repository write/mutation operation MUST call requireCanMutate() before executing.
 *
 * Invariant: OfflineDomainMutationRequests = 0
 */
class MutationCapabilityGate(
    private val connectivityFlow: StateFlow<ConnectivityState>,
    private val sessionStorage: SessionStorage
) {
    /**
     * Compute current capability snapshot synchronously.
     */
    fun getCapability(userRole: Int = 20): MutationCapability {
        if (!sessionStorage.hasActiveSession()) {
            return MutationCapability.SessionExpired
        }

        val connectivity = connectivityFlow.value
        if (connectivity != ConnectivityState.ONLINE) {
            return MutationCapability.OfflineReadOnly(sessionStorage.getLastSyncedAt())
        }

        // Guests (role 5) have read-only access
        if (userRole <= 5) {
            return MutationCapability.PermissionDenied("User role does not allow modifying this resource")
        }

        return MutationCapability.Allowed
    }

    /**
     * Authoritative guard: throws exception if write is forbidden.
     * Prevents any HTTP request or invalid local mutation while offline.
     */
    fun requireCanMutate(userRole: Int = 20) {
        when (val capability = getCapability(userRole)) {
            is MutationCapability.Allowed -> {
                // Allowed - proceed
            }
            is MutationCapability.OfflineReadOnly -> {
                throw OfflineMutationForbiddenException(
                    "Domain mutation rejected: device is offline or reconnecting. " +
                            "Hard invariant enforced: OfflineDomainMutationRequests = 0."
                )
            }
            is MutationCapability.SessionExpired -> {
                throw SessionExpiredException("Domain mutation rejected: session is expired or invalid.")
            }
            is MutationCapability.PermissionDenied -> {
                throw PermissionDeniedException("Domain mutation rejected: ${capability.reason}")
            }
        }
    }

    /**
     * Observes reactive capability flow for UI bindings.
     */
    fun observeCapability(userRole: Int = 20): Flow<MutationCapability> {
        return combine(connectivityFlow, sessionStorage.isLoggedIn) { connectivity, isLoggedIn ->
            if (!isLoggedIn) {
                MutationCapability.SessionExpired
            } else if (connectivity != ConnectivityState.ONLINE) {
                MutationCapability.OfflineReadOnly(sessionStorage.getLastSyncedAt())
            } else if (userRole <= 5) {
                MutationCapability.PermissionDenied("User role does not allow modifying this resource")
            } else {
                MutationCapability.Allowed
            }
        }
    }
}
