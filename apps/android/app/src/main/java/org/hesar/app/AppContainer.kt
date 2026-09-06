package org.hesar.app

import android.content.Context
import org.hesar.app.alarm.AlarmNotificationHelper
import org.hesar.app.alarm.AlarmScheduler
import org.hesar.app.data.local.HesarDatabase
import org.hesar.app.data.local.SessionStorage
import org.hesar.app.data.remote.NetworkClient
import org.hesar.app.data.remote.NetworkConnectivityMonitor
import org.hesar.app.data.repository.AlarmRepository
import org.hesar.app.data.repository.AuthRepository
import org.hesar.app.data.repository.IssueRepository
import org.hesar.app.data.repository.ProjectRepository
import org.hesar.app.data.repository.WorkspaceRepository
import org.hesar.app.domain.gate.MutationCapabilityGate

class AppContainer(private val context: Context) {

    val database: HesarDatabase by lazy {
        HesarDatabase.getInstance(context)
    }

    val sessionStorage: SessionStorage by lazy {
        SessionStorage.getInstance(context)
    }

    val connectivityMonitor: NetworkConnectivityMonitor by lazy {
        NetworkConnectivityMonitor(context)
    }

    val apiService by lazy {
        NetworkClient.createApiService(sessionStorage)
    }

    val mutationCapabilityGate: MutationCapabilityGate by lazy {
        MutationCapabilityGate(connectivityMonitor.currentState, sessionStorage)
    }

    val alarmScheduler: AlarmScheduler by lazy {
        AlarmScheduler(context)
    }

    val notificationHelper: AlarmNotificationHelper by lazy {
        AlarmNotificationHelper(context)
    }

    val authRepository: AuthRepository by lazy {
        AuthRepository(apiService, database, sessionStorage)
    }

    val workspaceRepository: WorkspaceRepository by lazy {
        WorkspaceRepository(apiService, database)
    }

    val projectRepository: ProjectRepository by lazy {
        ProjectRepository(apiService, database)
    }

    val issueRepository: IssueRepository by lazy {
        IssueRepository(apiService, database, mutationCapabilityGate)
    }

    val alarmRepository: AlarmRepository by lazy {
        AlarmRepository(context, apiService, database, alarmScheduler, notificationHelper)
    }
}
