package org.hesar.app.alarm

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Snooze
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import org.hesar.app.HesarApplication
import org.hesar.app.R
import org.hesar.app.ui.MainActivity
import org.hesar.app.ui.theme.HesarTheme
import org.hesar.app.util.JalaliDateHelper

class AlarmRingingActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Wake screen and show over lockscreen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        val alarmId = intent.getStringExtra(AlarmBroadcastReceiver.EXTRA_ALARM_ID) ?: ""
        val issueId = intent.getStringExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_ID) ?: ""
        val issueKey = intent.getStringExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_KEY) ?: "HESAR"
        val issueTitle = intent.getStringExtra(AlarmBroadcastReceiver.EXTRA_ISSUE_TITLE) ?: "هشدار تسک"

        setContent {
            HesarTheme {
                AlarmRingingScreen(
                    issueKey = issueKey,
                    issueTitle = issueTitle,
                    onStop = {
                        val stopIntent = Intent(this, AlarmBroadcastReceiver::class.java).apply {
                            action = AlarmBroadcastReceiver.ACTION_STOP_ALARM
                            putExtra(AlarmBroadcastReceiver.EXTRA_ALARM_ID, alarmId)
                        }
                        sendBroadcast(stopIntent)
                        finish()
                    },
                    onSnooze = { minutes ->
                        val snoozeIntent = Intent(this, AlarmBroadcastReceiver::class.java).apply {
                            action = AlarmBroadcastReceiver.ACTION_SNOOZE_ALARM
                            putExtra(AlarmBroadcastReceiver.EXTRA_ALARM_ID, alarmId)
                            putExtra(AlarmBroadcastReceiver.EXTRA_SNOOZE_MINUTES, minutes)
                        }
                        sendBroadcast(snoozeIntent)
                        finish()
                    },
                    onOpenIssue = {
                        val mainIntent = Intent(this, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            putExtra("route_issue_id", issueId)
                        }
                        startActivity(mainIntent)
                        finish()
                    }
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // If activity destroyed, ensure audio is stopped
        AlarmAudioPlayer.stop()
    }
}

@Composable
fun AlarmRingingScreen(
    issueKey: String,
    issueTitle: String,
    onStop: () -> Unit,
    onSnooze: (Int) -> Unit,
    onOpenIssue: () -> Unit
) {
    var showSnoozeMenu by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Alarm Icon Pulse
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(Color(0xFFEF4444).copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Alarm,
                    contentDescription = null,
                    tint = Color(0xFFEF4444),
                    modifier = Modifier.size(56.dp)
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Issue Key Badge
            Text(
                text = issueKey,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF38BDF8)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Issue Title
            Text(
                text = issueTitle,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Time in Jalali
            Text(
                text = JalaliDateHelper.formatEpochMillisToJalali(System.currentTimeMillis(), includeTime = true),
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFF94A3B8)
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Action: STOP (Primary, prominent red button)
            Button(
                onClick = onStop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Check, contentDescription = null, tint = Color.White)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.alarm_stop),
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Action: SNOOZE (Works completely offline!)
            Box {
                OutlinedButton(
                    onClick = { showSnoozeMenu = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.Snooze, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.alarm_snooze),
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                }

                DropdownMenu(
                    expanded = showSnoozeMenu,
                    onDismissRequest = { showSnoozeMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(stringResource(R.string.alarm_snooze_5m)) },
                        onClick = { showSnoozeMenu = false; onSnooze(5) }
                    )
                    DropdownMenuItem(
                        text = { Text(stringResource(R.string.alarm_snooze_10m)) },
                        onClick = { showSnoozeMenu = false; onSnooze(10) }
                    )
                    DropdownMenuItem(
                        text = { Text(stringResource(R.string.alarm_snooze_15m)) },
                        onClick = { showSnoozeMenu = false; onSnooze(15) }
                    )
                    DropdownMenuItem(
                        text = { Text(stringResource(R.string.alarm_snooze_30m)) },
                        onClick = { showSnoozeMenu = false; onSnooze(30) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Action: Open Issue
            OutlinedButton(
                onClick = onOpenIssue,
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = stringResource(R.string.alarm_open_issue),
                    color = Color(0xFF38BDF8)
                )
            }
        }
    }
}
