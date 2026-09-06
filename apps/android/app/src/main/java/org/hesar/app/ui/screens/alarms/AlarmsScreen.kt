package org.hesar.app.ui.screens.alarms

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.hesar.app.R
import org.hesar.app.data.repository.AlarmRepository
import org.hesar.app.domain.model.Alarm
import org.hesar.app.domain.model.ConnectivityState
import org.hesar.app.ui.common.OfflineBanner
import org.hesar.app.util.JalaliDateHelper

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlarmsScreen(
    alarmRepository: AlarmRepository,
    connectivityState: ConnectivityState,
    onNavigateToHealth: () -> Unit,
    onAlarmClick: (String) -> Unit
) {
    val alarms by alarmRepository.activeAlarmsFlow.collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.nav_alarms)) },
                actions = {
                    IconButton(onClick = onNavigateToHealth) {
                        Icon(
                            imageVector = Icons.Default.HealthAndSafety,
                            contentDescription = stringResource(R.string.alarm_health_title),
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    if (connectivityState == ConnectivityState.ONLINE) {
                        IconButton(onClick = { scope.launch { alarmRepository.syncAlarms() } }) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "همگام‌سازی"
                            )
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            OfflineBanner(
                connectivityState = connectivityState,
                lastSyncedAt = null
            )

            if (alarms.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = stringResource(R.string.empty_alarms),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(alarms, key = { it.id }) { alarm ->
                        AlarmItemCard(alarm = alarm, onClick = { onAlarmClick(alarm.issueId) })
                    }
                }
            }
        }
    }
}

@Composable
fun AlarmItemCard(
    alarm: Alarm,
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
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Alarm,
                contentDescription = null,
                tint = Color(0xFFEF4444),
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = alarm.issueIdentifier,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = alarm.issueTitle,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "زمان هشدار: ${JalaliDateHelper.formatEpochMillisToJalali(alarm.triggerEpochMillis, includeTime = true)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
