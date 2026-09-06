# Hesar Native Android Application

Official native Android client for **Hesar** (Plane fork with Persian/RTL/Jalali localization and exact alarm engine).

---

## 🏛️ Core Architecture & Design

The Android application is strictly native (**no WebView**) following modern Android Architecture standards:

```
UI (Jetpack Compose + Persian RTL)
      ↓
ViewModel / StateFlow
      ↓
Domain Gate (MutationCapabilityGate)  <-- Central Write Gate (OfflineDomainMutationRequests = 0)
      ↓
Repositories (Single Source of Truth)
      ↓
Room SQLite Database (Offline Cache)  ← Remote Sync (Retrofit + OkHttp + Session Cookies)
      ↓
Alarm Engine (AlarmManager exact scheduling + Room + AlarmBroadcastReceiver + BootReceiver)
```

---

## 🛡️ The Three Core Guarantees

### 1. Cached Offline Reading

- **Local Database as SSOT**: Room disk-backed database powers all UI screens.
- **Immediate Startup**: Opening the app offline opens the cached workspace without network blocks.
- **Cache Freshness**: Every cached view indicates `آخرین همگام‌سازی: ۱۲:۴۲` (`lastSyncedAt`).

### 2. Strict Read-Only Behavior While Offline

- **No Domain Write Queues**: Hesar Android is **NOT** an offline-editing app. There is no offline outbox or optimistic sync queue.
- **Authoritative Gate**: `MutationCapabilityGate` enforces `OfflineDomainMutationRequests = 0` at the repository layer before any HTTP request or local state modification.
- **Offline UI**: Persistent top banner `آفلاین — فقط خواندنی` (`Offline — Read only`). All edit controls, dropdowns, and comment composers are disabled with informative tooltips (`برای ویرایش به اینترنت متصل شوید.`).

### 3. Reliable Local Alarms

- **Zero Network at Ring Time**: Synchronized alarms from backend `GET /api/users/me/issue-alarms/` are persisted to Room and scheduled directly in Android `AlarmManager`. The device requires **NO internet** at trigger time.
- **Process Death & Reboot Resilience**:
  - `AlarmManager.setAlarmClock` / `setAndAllowWhileIdle` wakes device from deep Doze.
  - `BootReceiver` listens to `ACTION_BOOT_COMPLETED` and restores all active future alarms from Room.
  - `TimeChangeReceiver` listens to `ACTION_TIME_CHANGED` and `ACTION_TIMEZONE_CHANGED`.
- **Presentation Ladder**:
  - **Level A**: Full-screen `AlarmRingingActivity` (`showWhenLocked`, `turnScreenOn`, sound, vibration, "توقف", "تعویق").
  - **Level B**: High-priority Heads-up alarm notification with action buttons.
  - **Level C**: Health status degradation visible in app settings.
- **Offline Snooze**: "تعویق" (5, 10, 15, 30 min) functions locally even without internet.
- **Safe Stop Semantics**: Stopping audio does NOT delete the server alarm definition.

---

## 🌍 Persian / RTL & Jalali Support

- **RTL from Day 1**: Dynamic `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl)`.
- **Jalali Calendar**: `JalaliDateHelper` converts Gregorian timestamps to Solar Hijri with accurate Persian month names (`فروردین`, `اردیبهشت`, `شهریور`, etc.) and numerals (`۰-۹`).
- **Technical Keys Untouched**: Issue keys (`HES-42`), URLs, UUIDs remain LTR/unmodified.

---

## ⚙️ How to Build Independently

The Android project is kept completely independent of the pnpm monorepo.

### Prerequisites

- Java 21 LTS (`/Library/Java/JavaVirtualMachines/jdk-21.jdk`)
- Android SDK (`compileSdk = 35`, `buildToolsVersion = "35.0.0"`)

### Commands

```bash
cd apps/android

# Run all unit tests (MutationCapabilityGate, AlarmRepository, Jalali conversion)
./gradlew test -g .gradle-home

# Build Debug APK
./gradlew assembleDebug -g .gradle-home
```

Output APK:

```
apps/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🧪 Hard Invariant Verification Status

| Invariant                                     | Result   | Verification Method                                                                                      |
| --------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `OfflineDomainMutationRequests = 0`           | **PASS** | `MutationCapabilityGateTest` unit tests verify `OfflineMutationForbiddenException` is thrown before HTTP |
| `CachedDataLostOnNetworkLoss = 0`             | **PASS** | Room database persists disk cache independently of network                                               |
| `CachedDataLostOnProcessDeath = 0`            | **PASS** | Disk-backed SQLite Room database                                                                         |
| `CrossAccountCachedDataLeak = 0`              | **PASS** | `AuthRepository.signOut()` clears `SessionStorage` and executes `database.clearProtectedUserData()`      |
| `MissedAlarmDueToNetworkLoss = 0`             | **PASS** | Alarm scheduled via `AlarmManager` requiring zero network at trigger                                     |
| `MissedAlarmDueToAppProcessDeath = 0`         | **PASS** | `AlarmBroadcastReceiver` registered in `AndroidManifest.xml`                                             |
| `MissedAlarmDueToDeviceReboot = 0`            | **PASS** | `BootReceiver` reschedules future alarms from Room on `BOOT_COMPLETED`                                   |
| `ChangedServerAlarmLeavesOldSchedule = 0`     | **PASS** | `AlarmRepository.syncAlarms()` cancels obsolete `PendingIntent`s before rescheduling                     |
| `DeletedServerAlarmStillScheduledLocally = 0` | **PASS** | `AlarmRepository.syncAlarms()` cancels deleted server alarms                                             |
| `PersianRTLRegression = 0`                    | **PASS** | Default RTL composition and Jalali date conversion validated                                             |
