package org.hesar.app.data.remote

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.hesar.app.domain.model.ConnectivityState
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Robust network monitor using Android ConnectivityManager NetworkCapabilities.
 * Distinguishes ONLINE, OFFLINE, RECONNECTING, and BACKEND_UNREACHABLE.
 */
class NetworkConnectivityMonitor(
    private val context: Context,
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Default)
) {
    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val _currentState = MutableStateFlow(determineInitialState())
    val currentState: StateFlow<ConnectivityState> = _currentState.asStateFlow()

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            coroutineScope.launch {
                _currentState.value = ConnectivityState.RECONNECTING
                // Verify internet access by checking capabilities
                val hasInternet = checkNetworkCapabilities(network)
                if (hasInternet) {
                    _currentState.value = ConnectivityState.ONLINE
                } else {
                    _currentState.value = ConnectivityState.BACKEND_UNREACHABLE
                }
            }
        }

        override fun onLost(network: Network) {
            _currentState.value = ConnectivityState.OFFLINE
        }

        override fun onCapabilitiesChanged(
            network: Network,
            networkCapabilities: NetworkCapabilities
        ) {
            val hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                    networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
            _currentState.value = if (hasInternet) ConnectivityState.ONLINE else ConnectivityState.OFFLINE
        }
    }

    init {
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, networkCallback)
    }

    private fun determineInitialState(): ConnectivityState {
        val activeNetwork = connectivityManager.activeNetwork ?: return ConnectivityState.OFFLINE
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return ConnectivityState.OFFLINE
        val hasInternet = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        return if (hasInternet) ConnectivityState.ONLINE else ConnectivityState.OFFLINE
    }

    /**
     * For unit tests or simulated offline testing.
     */
    fun setSimulatedState(state: ConnectivityState) {
        _currentState.value = state
    }

    private fun checkNetworkCapabilities(network: Network): Boolean {
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }
}
