package org.hesar.app.ui.common

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import org.hesar.app.R
import org.hesar.app.domain.model.ConnectivityState
import org.hesar.app.domain.model.MutationCapability
import org.hesar.app.util.JalaliDateHelper

@Composable
fun OfflineBanner(
    connectivityState: ConnectivityState,
    lastSyncedAt: Long?,
    modifier: Modifier = Modifier
) {
    val isOffline = connectivityState != ConnectivityState.ONLINE

    AnimatedVisibility(
        visible = isOffline,
        enter = expandVertically(),
        exit = shrinkVertically()
    ) {
        val bgColor = if (connectivityState == ConnectivityState.RECONNECTING) {
            Color(0xFFE0F2FE)
        } else {
            Color(0xFFFEF3C7)
        }
        val contentColor = if (connectivityState == ConnectivityState.RECONNECTING) {
            Color(0xFF0369A1)
        } else {
            Color(0xFFB45309)
        }

        Surface(
            modifier = modifier.fillMaxWidth(),
            color = bgColor,
            contentColor = contentColor,
            shadowElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = if (connectivityState == ConnectivityState.RECONNECTING) Icons.Default.Sync else Icons.Default.CloudOff,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (connectivityState == ConnectivityState.RECONNECTING) {
                            stringResource(R.string.reconnecting)
                        } else {
                            stringResource(R.string.offline_read_only)
                        },
                        style = MaterialTheme.typography.labelMedium
                    )
                }

                if (lastSyncedAt != null && lastSyncedAt > 0) {
                    Text(
                        text = stringResource(
                            R.string.last_synced,
                            JalaliDateHelper.formatEpochMillisToJalali(lastSyncedAt, includeTime = true)
                        ),
                        style = MaterialTheme.typography.bodySmall,
                        color = contentColor.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}

/**
 * Wraps any mutation control (button, dropdown, composer).
 * When offline or lacking permission, disables it and displays an explanatory tooltip or snackbar.
 */
@Composable
fun GuardedMutationControl(
    capability: MutationCapability,
    modifier: Modifier = Modifier,
    content: @Composable (isEnabled: Boolean) -> Unit
) {
    var showTooltip by remember { mutableStateOf(false) }
    val isEnabled = capability.isMutationAllowed

    Column(modifier = modifier) {
        Box(
            modifier = Modifier.clickable(enabled = !isEnabled) {
                showTooltip = !showTooltip
            }
        ) {
            content(isEnabled)
        }

        if (!isEnabled && showTooltip) {
            val message = when (capability) {
                is MutationCapability.OfflineReadOnly -> stringResource(R.string.offline_connect_to_edit)
                is MutationCapability.SessionExpired -> "نشست کاری منقضی شده است."
                is MutationCapability.PermissionDenied -> capability.reason
                is MutationCapability.Allowed -> ""
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp)
                    .background(Color(0xFFFEF3C7), RoundedCornerShape(4.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Color(0xFFB45309),
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = message,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFB45309)
                    )
                }
            }
        }
    }
}
