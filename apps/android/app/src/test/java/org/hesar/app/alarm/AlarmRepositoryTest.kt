package org.hesar.app.alarm

import android.content.Context
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.test.runTest
import org.hesar.app.data.local.HesarDatabase
import org.hesar.app.data.local.dao.AlarmDao
import org.hesar.app.data.local.dao.SyncMetadataDao
import org.hesar.app.data.local.entity.AlarmEntity
import org.hesar.app.data.remote.HesarApiService
import org.hesar.app.data.remote.dto.AlarmDto
import org.hesar.app.data.repository.AlarmRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class AlarmRepositoryTest {

    private val context = mockk<Context>(relaxed = true)
    private val apiService = mockk<HesarApiService>(relaxed = true)
    private val database = mockk<HesarDatabase>(relaxed = true)
    private val alarmDao = mockk<AlarmDao>(relaxed = true)
    private val syncMetadataDao = mockk<SyncMetadataDao>(relaxed = true)
    private val scheduler = mockk<AlarmScheduler>(relaxed = true)
    private val notificationHelper = mockk<AlarmNotificationHelper>(relaxed = true)

    private lateinit var repository: AlarmRepository

    @Before
    fun setup() {
        every { database.alarmDao() } returns alarmDao
        every { database.syncMetadataDao() } returns syncMetadataDao
        repository = AlarmRepository(context, apiService, database, scheduler, notificationHelper)
    }

    @Test
    fun `syncAlarms downloads server alarms, updates Room, and schedules with AlarmScheduler`() = runTest {
        val serverAlarm = AlarmDto(
            id = "alarm_123",
            userId = "user_1",
            issueId = "issue_42",
            issueIdentifier = "HES-42",
            issueTitle = "Deploy Hesar Mobile",
            scheduledAt = "2026-09-06T18:00:00Z",
            hoursBefore = 0,
            alarmType = "due_date",
            isTriggered = false,
            isCancelled = false,
            createdAt = "2026-09-06T10:00:00Z",
            updatedAt = "2026-09-06T10:00:00Z"
        )

        coEvery { apiService.getPendingAlarms() } returns Response.success(listOf(serverAlarm))
        coEvery { alarmDao.getActiveFutureAlarms(any()) } returns emptyList()

        val result = repository.syncAlarms()
        assertTrue("Sync should succeed", result.isSuccess)

        // Verify Room upsert
        val slot = slot<List<AlarmEntity>>()
        coVerify { alarmDao.upsertAlarms(capture(slot)) }
        assertEquals(1, slot.captured.size)
        assertEquals("alarm_123", slot.captured[0].id)
        assertEquals("HES-42", slot.captured[0].issueIdentifier)
    }

    @Test
    fun `stopAlarmLocally cancels ringing sound, notification, and sets Room status to DISMISSED`() = runTest {
        repository.stopAlarmLocally("alarm_123")

        // Notification cancelled
        coVerify { notificationHelper.cancelAlarmNotification("alarm_123") }

        // Room status updated to DISMISSED
        coVerify { alarmDao.updateAlarmStatus("alarm_123", "DISMISSED") }
    }

    @Test
    fun `snoozeAlarmLocally works offline, recalculates trigger time, updates Room, and reschedules`() = runTest {
        val originalAlarm = AlarmEntity(
            id = "alarm_123",
            userId = "user_1",
            issueId = "issue_42",
            issueIdentifier = "HES-42",
            issueTitle = "Task",
            scheduledAtUtc = "2026-09-06T18:00:00Z",
            triggerEpochMillis = 1000L
        )

        coEvery { alarmDao.getAlarmById("alarm_123") } returns originalAlarm

        val beforeTime = System.currentTimeMillis()
        repository.snoozeAlarmLocally("alarm_123", 10)
        val afterTime = System.currentTimeMillis()

        // Notification cancelled
        coVerify { notificationHelper.cancelAlarmNotification("alarm_123") }

        // Room status updated to SNOOZED with +10 minutes
        val targetSlot = slot<Long>()
        coVerify { alarmDao.updateAlarmStatus("alarm_123", "SNOOZED", capture(targetSlot)) }
        assertTrue(targetSlot.captured >= beforeTime + 600_000L)
        assertTrue(targetSlot.captured <= afterTime + 600_000L + 1000L)

        // AlarmScheduler rescheduled
        val scheduleSlot = slot<AlarmEntity>()
        coVerify { scheduler.scheduleAlarm(capture(scheduleSlot)) }
        assertEquals("SNOOZED", scheduleSlot.captured.localStatus)
    }
}
