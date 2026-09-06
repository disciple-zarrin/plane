package org.hesar.app.domain.model

enum class ConnectivityState {
    ONLINE,
    OFFLINE,
    RECONNECTING,
    BACKEND_UNREACHABLE;

    val isOnline: Boolean
        get() = this == ONLINE
}
