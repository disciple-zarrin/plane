package org.hesar.app.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import org.hesar.app.HesarApplication
import org.hesar.app.ui.screens.login.LoginScreen
import org.hesar.app.ui.screens.main.MainScaffold
import org.hesar.app.ui.theme.HesarTheme

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        // Notification permission granted/denied handled gracefully
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request POST_NOTIFICATIONS on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        val app = application as HesarApplication
        val container = app.container

        val initialIssueId = intent?.getStringExtra("route_issue_id")

        setContent {
            HesarTheme {
                val isLoggedIn by container.sessionStorage.isLoggedIn.collectAsState()

                if (isLoggedIn) {
                    MainScaffold(
                        container = container,
                        initialIssueId = initialIssueId,
                        onLogoutSuccess = {}
                    )
                } else {
                    LoginScreen(
                        authRepository = container.authRepository,
                        onLoginSuccess = {}
                    )
                }
            }
        }
    }
}
