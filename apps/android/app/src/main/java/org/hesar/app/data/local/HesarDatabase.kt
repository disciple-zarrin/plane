package org.hesar.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import org.hesar.app.data.local.dao.AlarmDao
import org.hesar.app.data.local.dao.CommentDao
import org.hesar.app.data.local.dao.IssueDao
import org.hesar.app.data.local.dao.ProjectDao
import org.hesar.app.data.local.dao.SyncMetadataDao
import org.hesar.app.data.local.dao.WorkspaceDao
import org.hesar.app.data.local.entity.AlarmEntity
import org.hesar.app.data.local.entity.CommentEntity
import org.hesar.app.data.local.entity.IssueEntity
import org.hesar.app.data.local.entity.IssueLabelEntity
import org.hesar.app.data.local.entity.IssueStateEntity
import org.hesar.app.data.local.entity.ProjectEntity
import org.hesar.app.data.local.entity.SyncMetadataEntity
import org.hesar.app.data.local.entity.WorklogEntity
import org.hesar.app.data.local.entity.WorkspaceEntity

@Database(
    entities = [
        WorkspaceEntity::class,
        ProjectEntity::class,
        IssueEntity::class,
        IssueStateEntity::class,
        IssueLabelEntity::class,
        CommentEntity::class,
        WorklogEntity::class,
        AlarmEntity::class,
        SyncMetadataEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class HesarDatabase : RoomDatabase() {

    abstract fun workspaceDao(): WorkspaceDao
    abstract fun projectDao(): ProjectDao
    abstract fun issueDao(): IssueDao
    abstract fun commentDao(): CommentDao
    abstract fun alarmDao(): AlarmDao
    abstract fun syncMetadataDao(): SyncMetadataDao

    suspend fun clearProtectedUserData() {
        // Multi-account / logout isolation: clear all cached domain and alarm data
        runInTransaction {
            // Note: Room clearAllTables wipes all tables
        }
        clearAllTables()
    }

    companion object {
        private const val DATABASE_NAME = "hesar_local_cache.db"

        @Volatile
        private var instance: HesarDatabase? = null

        fun getInstance(context: Context): HesarDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    HesarDatabase::class.java,
                    DATABASE_NAME
                )
                    .fallbackToDestructiveMigration() // Note: In production we maintain explicit migrations
                    .build()
                    .also { instance = it }
            }
        }
    }
}
