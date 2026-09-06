package org.hesar.app.ui.screens.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import org.hesar.app.AppContainer
import org.hesar.app.R
import org.hesar.app.domain.model.ConnectivityState
import org.hesar.app.ui.screens.alarms.AlarmHealthScreen
import org.hesar.app.ui.screens.alarms.AlarmsScreen
import org.hesar.app.ui.screens.issues.IssueDetailScreen
import org.hesar.app.ui.screens.issues.IssueListScreen
import org.hesar.app.ui.screens.settings.SettingsScreen

enum class NavItem(val labelRes: Int, val icon: ImageVector) {
    HOME(R.string.nav_home, Icons.Default.Home),
    ISSUES(R.string.nav_issues, Icons.Default.Assignment),
    PROJECTS(R.string.nav_projects, Icons.Default.Folder),
    ALARMS(R.string.nav_alarms, Icons.Default.Alarm),
    MORE(R.string.nav_more, Icons.Default.MoreHoriz)
}

@Composable
fun MainScaffold(
    container: AppContainer,
    initialIssueId: String? = null,
    onLogoutSuccess: () -> Unit
) {
    var selectedItem by remember { mutableStateOf(if (initialIssueId != null) NavItem.ISSUES else NavItem.ISSUES) }
    var selectedIssueId by remember { mutableStateOf<String?>(initialIssueId) }
    var showAlarmHealth by remember { mutableStateOf(false) }

    val connectivityState by container.connectivityMonitor.currentState.collectAsState()
    val activeWorkspaceSlug = container.sessionStorage.getActiveWorkspaceSlug() ?: "default"

    // If an issue is selected, show detail screen
    if (selectedIssueId != null) {
        IssueDetailScreen(
            issueId = selectedIssueId!!,
            workspaceSlug = activeWorkspaceSlug,
            projectId = "default_project",
            issueRepository = container.issueRepository,
            capabilityGate = container.mutationCapabilityGate,
            connectivityState = connectivityState,
            onBack = { selectedIssueId = null }
        )
        return
    }

    // If Alarm Health diagnostics is opened
    if (showAlarmHealth) {
        AlarmHealthScreen(
            alarmRepository = container.alarmRepository,
            onBack = { showAlarmHealth = false }
        )
        return
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavItem.entries.forEach { item ->
                    NavigationBarItem(
                        selected = selectedItem == item,
                        onClick = { selectedItem = item },
                        icon = { Icon(item.icon, contentDescription = stringResource(item.labelRes)) },
                        label = { Text(stringResource(item.labelRes)) }
                    )
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (selectedItem) {
                NavItem.HOME, NavItem.ISSUES, NavItem.PROJECTS -> {
                    IssueListScreen(
                        projectId = "default_project",
                        workspaceSlug = activeWorkspaceSlug,
                        workspaceId = "default_ws",
                        issueRepository = container.issueRepository,
                        capabilityGate = container.mutationCapabilityGate,
                        connectivityState = connectivityState,
                        onIssueClick = { selectedIssueId = it }
                    )
                }
                NavItem.ALARMS -> {
                    AlarmsScreen(
                        alarmRepository = container.alarmRepository,
                        connectivityState = connectivityState,
                        onNavigateToHealth = { showAlarmHealth = true },
                        onAlarmClick = { selectedIssueId = it }
                    )
                }
                NavItem.MORE -> {
                    SettingsScreen(
                        authRepository = container.authRepository,
                        database = container.database,
                        onLogoutSuccess = onLogoutSuccess
                    )
                }
            }
        }
    }
}
