package org.hesar.app.gate

import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableStateFlow
import org.hesar.app.data.local.SessionStorage
import org.hesar.app.domain.gate.MutationCapabilityGate
import org.hesar.app.domain.model.ConnectivityState
import org.hesar.app.domain.model.MutationCapability
import org.hesar.app.domain.model.OfflineMutationForbiddenException
import org.hesar.app.domain.model.SessionExpiredException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test

class MutationCapabilityGateTest {

    private val sessionStorage = mockk<SessionStorage>(relaxed = true)
    private val connectivityFlow = MutableStateFlow(ConnectivityState.ONLINE)
    private lateinit var gate: MutationCapabilityGate

    @Before
    fun setup() {
        gate = MutationCapabilityGate(connectivityFlow, sessionStorage)
    }

    @Test
    fun `online with active session allows mutation`() {
        every { sessionStorage.hasActiveSession() } returns true
        connectivityFlow.value = ConnectivityState.ONLINE

        val capability = gate.getCapability(userRole = 20)
        assertTrue("Expected Allowed capability when online", capability is MutationCapability.Allowed)
        assertTrue(capability.isMutationAllowed)

        // Must not throw
        gate.requireCanMutate(userRole = 20)
    }

    @Test
    fun `offline strictly forbids mutation and throws OfflineMutationForbiddenException`() {
        every { sessionStorage.hasActiveSession() } returns true
        connectivityFlow.value = ConnectivityState.OFFLINE

        val capability = gate.getCapability(userRole = 20)
        assertTrue("Expected OfflineReadOnly capability", capability is MutationCapability.OfflineReadOnly)
        assertFalse(capability.isMutationAllowed)

        try {
            gate.requireCanMutate(userRole = 20)
            fail("Expected OfflineMutationForbiddenException when offline")
        } catch (e: OfflineMutationForbiddenException) {
            // Expected: OfflineDomainMutationRequests = 0
            assertTrue(e.message!!.contains("OfflineDomainMutationRequests = 0"))
        }
    }

    @Test
    fun `reconnecting state strictly forbids mutation`() {
        every { sessionStorage.hasActiveSession() } returns true
        connectivityFlow.value = ConnectivityState.RECONNECTING

        val capability = gate.getCapability(userRole = 20)
        assertTrue("Expected OfflineReadOnly during reconnecting", capability is MutationCapability.OfflineReadOnly)
        assertFalse(capability.isMutationAllowed)

        try {
            gate.requireCanMutate(userRole = 20)
            fail("Expected OfflineMutationForbiddenException during reconnecting")
        } catch (e: OfflineMutationForbiddenException) {
            // Success
        }
    }

    @Test
    fun `session expired forbids mutation and throws SessionExpiredException`() {
        every { sessionStorage.hasActiveSession() } returns false
        connectivityFlow.value = ConnectivityState.ONLINE

        val capability = gate.getCapability(userRole = 20)
        assertEquals(MutationCapability.SessionExpired, capability)
        assertFalse(capability.isMutationAllowed)

        try {
            gate.requireCanMutate(userRole = 20)
            fail("Expected SessionExpiredException when session is missing")
        } catch (e: SessionExpiredException) {
            // Success
        }
    }

    @Test
    fun `guest role is read only even when online`() {
        every { sessionStorage.hasActiveSession() } returns true
        connectivityFlow.value = ConnectivityState.ONLINE

        val capability = gate.getCapability(userRole = 5) // Guest role
        assertTrue(capability is MutationCapability.PermissionDenied)
        assertFalse(capability.isMutationAllowed)
    }
}
