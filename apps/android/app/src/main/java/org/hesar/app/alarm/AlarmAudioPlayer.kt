package org.hesar.app.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

object AlarmAudioPlayer {

    private const val TAG = "AlarmAudioPlayer"
    private const val MAX_RING_DURATION_MS = 60_000L // 60 seconds bounded limit

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var handler: Handler? = null
    private var isPlaying = false

    private val autoStopRunnable = Runnable {
        Log.i(TAG, "Alarm reached maximum duration (60s), stopping audio")
        stop()
    }

    @Synchronized
    fun start(context: Context) {
        if (isPlaying) {
            Log.d(TAG, "Alarm is already playing, ignoring duplicate start request")
            return
        }
        isPlaying = true

        try {
            // Sound
            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

            mediaPlayer = MediaPlayer().apply {
                setDataSource(context, alarmUri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                isLooping = true
                prepare()
                start()
            }

            // Vibration
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            val pattern = longArrayOf(0, 600, 600, 600)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }

            // Schedule auto-stop to prevent endless ringing
            if (handler == null) {
                handler = Handler(Looper.getMainLooper())
            }
            handler?.postDelayed(autoStopRunnable, MAX_RING_DURATION_MS)
            Log.i(TAG, "Alarm ringing and vibration started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start alarm audio or vibration", e)
        }
    }

    @Synchronized
    fun stop() {
        if (!isPlaying) return
        isPlaying = false

        handler?.removeCallbacks(autoStopRunnable)

        try {
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping mediaPlayer", e)
        } finally {
            mediaPlayer = null
        }

        try {
            vibrator?.cancel()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping vibrator", e)
        } finally {
            vibrator = null
        }

        Log.i(TAG, "Alarm ringing stopped")
    }

    fun isRinging(): Boolean = isPlaying
}
