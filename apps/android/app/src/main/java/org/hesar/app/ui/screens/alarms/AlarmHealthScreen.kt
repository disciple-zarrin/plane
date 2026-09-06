package org.hesar.app.ui.screens.alarms

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BatteryAlert
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Button
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.hesar.app.R
import org.hesar.app.data.repository.AlarmRepository
import org.hesar.app.util.JalaliDateHelper

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlarmHealthScreen(
    alarmRepository: AlarmRepository,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scheduledCount by alarmRepository.activeAlarmCountFlow.collectAsState(initial = 0)

    val canExact = alarmRepository.canScheduleExactAlarms()
    val notifEnabled = alarmRepository.areNotificationsEnabled()

    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    val isIgnoringBatteryOptimizations = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        powerManager.isIgnoringBatteryOptimizations(context.packageName)
    } else {
        true
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.alarm_health_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "بازگشت")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Exact Alarms Permission
            DiagnosticsCard(
                title = stringResource(R.string.alarm_channel_name),
                subtitle = if (canExact) stringResource(R.string.alarm_status_exact_allowed)
                else stringResource(R.string.alarm_status_exact_denied),
                isOk = canExact,
                actionText = if (!canExact) stringResource(R.string.alarm_open_settings) else null,
                rationale = if (!canExact) stringResource(R.string.alarm_permission_exact_rationale) else null,
                onAction = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                            data = Uri.parse("package:${context.packageName}")
                        }
                        context.startActivity(intent)
                    }
                }
            )

            // 2. Notification Permission
            DiagnosticsCard(
                title = stringResource(R.string.notification_channel_name),
                subtitle = if (notifEnabled) stringResource(R.string.alarm_status_notif_enabled)
                else stringResource(R.string.alarm_status_notif_disabled),
                isOk = notifEnabled,
                actionText = if (!notifEnabled) stringResource(R.string.alarm_open_settings) else null,
                rationale = if (!notifEnabled) stringResource(R.string.alarm_permission_notif_denied) else null,
                onAction = {
                    val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    }
                    context.startActivity(intent)
                }
            )

            // 3. Battery Restrictions
            DiagnosticsCard(
                title = "مصرف باتری",
                subtitle = if (isIgnoringBatteryOptimizations) stringResource(R.string.alarm_status_battery_normal)
                else stringResource(R.string.alarm_status_battery_restricted),
                isOk = isIgnoringBatteryOptimizations,
                actionText = null,
                rationale = if (!isIgnoringBatteryOptimizations) "برای پایداری بیشتر زنگ هشدار در پس‌زمینه، بهینه‌سازی باتری را روی حالت عادی بگذارید." else null,
                onAction = {}
            )

            // 4. Scheduled Alarms Count
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "هشدارهای زمان‌بندی‌شده محلی",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "تعداد زنگ‌های محلی فعال در دستگاه",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(
                        text = JalaliDateHelper.toPersianDigits(scheduledCount.toString()),
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}

@Composable
fun DiagnosticsCard(
    title: String,
    subtitle: String,
    isOk: Boolean,
    actionText: String? = null,
    rationale: String? = null,
    onAction: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isOk) MaterialTheme.colorScheme.surface else Color(0xFFFEF2F2)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (isOk) Icons.Default.CheckCircle else Icons.Default.Error,
                    contentDescription = null,
                    tint = if (isOk) Color(0xFF10B981) else Color(0xFFEF4444),
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (isOk) Color(0xFF10B981) else Color(0xFFEF4444)
                    )
                }
            }

            if (rationale != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = rationale,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (actionText != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onAction,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(actionText)
                }
            }
        }
    }
}
