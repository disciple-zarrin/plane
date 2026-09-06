package org.hesar.app.work

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import org.hesar.app.HesarApplication
import java.util.concurrent.TimeUnit

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        Log.i(TAG, "Starting background sync work...")
        val app = applicationContext as? HesarApplication ?: return Result.success()

        val sessionStorage = app.container.sessionStorage
        if (!sessionStorage.hasActiveSession()) {
            Log.d(TAG, "No active session, skipping sync")
            return Result.success()
        }

        return try {
            // 1. Sync alarms
            app.container.alarmRepository.syncAlarms()

            // 2. Sync workspaces & projects
            app.container.workspaceRepository.syncWorkspaces()
            val activeSlug = sessionStorage.getActiveWorkspaceSlug()
            if (activeSlug != null) {
                // Background refresh for active workspace
            }

            Log.i(TAG, "Background sync completed successfully")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Background sync failed", e)
            Result.retry()
        }
    }

    companion object {
        private const val TAG = "SyncWorker"
        private const val UNIQUE_WORK_NAME = "hesar_periodic_sync"

        fun schedulePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val request = PeriodicWorkRequestBuilder<SyncWorker>(1, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}
