package org.hesar.app.data.remote

import okhttp3.Interceptor
import okhttp3.Response
import org.hesar.app.data.local.SessionStorage

class SessionInterceptor(
    private val sessionStorage: SessionStorage
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val requestBuilder = originalRequest.newBuilder()
            .header("Accept", "application/json")

        val sessionId = sessionStorage.getSessionId()
        if (!sessionId.isNullOrBlank()) {
            requestBuilder.header("Cookie", "session-id=$sessionId")
        }

        val response = chain.proceed(requestBuilder.build())

        // Save session-id cookie if returned by backend (e.g. login or session refresh)
        val setCookieHeaders = response.headers("Set-Cookie")
        for (header in setCookieHeaders) {
            if (header.startsWith("session-id=")) {
                val cookieValue = header.substringAfter("session-id=").substringBefore(";")
                if (cookieValue.isNotBlank()) {
                    val currentUser = sessionStorage.getCurrentUser()
                    if (currentUser != null) {
                        sessionStorage.saveSession(cookieValue, currentUser)
                    }
                }
            }
        }

        // Detect expired session
        if (response.code == 401 && !originalRequest.url.encodedPath.contains("/auth/sign-in")) {
            sessionStorage.clearSession()
        }

        return response
    }
}
