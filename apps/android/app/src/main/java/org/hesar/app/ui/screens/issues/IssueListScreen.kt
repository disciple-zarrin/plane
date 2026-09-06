package org.hesar.app.ui.screens.issues

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.hesar.app.R
import org.hesar.app.data.repository.IssueRepository
import org.hesar.app.domain.gate.MutationCapabilityGate
import org.hesar.app.domain.model.ConnectivityState
import org.hesar.app.domain.model.Issue
import org.hesar.app.domain.model.MutationCapability
import org.hesar.app.ui.common.GuardedMutationControl
import org.hesar.app.ui.common.OfflineBanner
import org.hesar.app.util.JalaliDateHelper

@Composable
fun IssueListScreen(
    projectId: String,
    workspaceSlug: String,
    workspaceId: String,
    issueRepository: IssueRepository,
    capabilityGate: MutationCapabilityGate,
    connectivityState: ConnectivityState,
    onIssueClick: (String) -> Unit
) {
    val issues by issueRepository.getIssuesFlow(projectId).collectAsState(initial = emptyList())
    val lastSyncedAt by issueRepository.getLastSyncedAtFlow(projectId).collectAsState(initial = null)
    val capability by capabilityGate.observeCapability().collectAsState(initial = capabilityGate.getCapability())

    val snackbarHostState = remember { SnackbarHostStateState() }
    val scope = rememberCoroutineScope()
    var searchQuery by remember { mutableStateOf("") }
    var isRefreshing by remember { mutableStateOf(false) }

    val filteredIssues = remember(issues, searchQuery) {
        if (searchQuery.isBlank()) issues
        else issues.filter {
            it.name.contains(searchQuery, ignoreCase = true) ||
                    it.displayKey.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            GuardedMutationControl(capability = capability) { isEnabled ->
                FloatingActionButton(
                    onClick = {
                        if (isEnabled) {
                            // Show create issue dialog
                        }
                    },
                    containerColor = if (isEnabled) MaterialTheme.colorScheme.primary else Color.Gray,
                    contentColor = Color.White
                ) {
                    Icon(Icons.Default.Add, contentDescription = "ایجاد تسک جدید")
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Persistent Offline Indicator
            OfflineBanner(
                connectivityState = connectivityState,
                lastSyncedAt = lastSyncedAt
            )

            // Search and Refresh Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = {
                        Text(
                            if (connectivityState != ConnectivityState.ONLINE)
                                stringResource(R.string.offline_search_hint)
                            else stringResource(R.string.search)
                        )
                    },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                IconButton(
                    onClick = {
                        if (connectivityState == ConnectivityState.ONLINE) {
                            isRefreshing = true
                            scope.launch {
                                issueRepository.syncIssues(workspaceSlug, workspaceId, projectId)
                                isRefreshing = false
                            }
                        } else {
                            // Offline invariant: Do not spin indefinitely. Inform user.
                            scope.launch {
                                snackbarHostState.showSnackbar("اتصال اینترنت در دسترس نیست.")
                            }
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "همگام‌سازی",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Cached Issues List
            if (filteredIssues.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = stringResource(R.string.empty_issues),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredIssues, key = { it.id }) { issue ->
                        IssueCard(issue = issue, onClick = { onIssueClick(issue.id) })
                    }
                }
            }
        }
    }
}

@Composable
fun IssueCard(
    issue: Issue,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Issue Key (LTR formatting)
                Text(
                    text = issue.displayKey,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )

                // State Badge
                if (issue.stateName != null) {
                    val stateColor = parseHexColor(issue.stateColor) ?: MaterialTheme.colorScheme.primary
                    Box(
                        modifier = Modifier
                            .background(stateColor.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = issue.stateName,
                            style = MaterialTheme.typography.labelSmall,
                            color = stateColor,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Issue Title
            Text(
                text = issue.name,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            if (issue.targetDate != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "سررسید: ${JalaliDateHelper.formatIsoToJalali(issue.targetDate)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

fun SnackbarHostStateState(): SnackbarHostState = SnackbarHostState()

fun parseHexColor(hex: String?): Color? {
    if (hex.isNullOrBlank()) return null
    return try {
        val clean = hex.removePrefix("#")
        val colorInt = clean.toLong(16)
        if (clean.length == 6) {
            Color(0xFF000000 or colorInt)
        } else {
            Color(colorInt)
        }
    } catch (_: Exception) {
        null
    }
}
