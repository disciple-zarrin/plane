package org.hesar.app.data.remote

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import org.hesar.app.data.local.SessionStorage
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object NetworkClient {

    fun createApiService(sessionStorage: SessionStorage): HesarApiService {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.HEADERS // Avoid logging private tokens/cookies
        }

        val sessionInterceptor = SessionInterceptor(sessionStorage)

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(sessionInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()

        val baseUrl = sessionStorage.getBackendBaseUrl().trimEnd('/') + "/"

        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        return retrofit.create(HesarApiService::class.java)
    }
}
