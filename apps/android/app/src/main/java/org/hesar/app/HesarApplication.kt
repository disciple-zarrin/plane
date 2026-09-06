package org.hesar.app

import android.app.Application
import org.hesar.app.work.SyncWorker

class HesarApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)

        // Schedule periodic background sync
        SyncWorker.schedulePeriodicSync(this)
    }
}
