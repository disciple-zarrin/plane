/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return (
      registry[uri] ||
      new Promise((resolve) => {
        if ("document" in self) {
          const script = document.createElement("script");
          script.src = uri;
          script.onload = resolve;
          document.head.appendChild(script);
        } else {
          nextDefineUri = uri;
          importScripts(uri);
          resolve();
        }
      }).then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = (depUri) => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require,
    };
    registry[uri] = Promise.all(depsNames.map((depName) => specialDeps[depName] || require(depName))).then((deps) => {
      factory(...deps);
      return exports;
    });
  };
}
define(["./workbox-9f2f79cf"], function (workbox) {
  "use strict";

  importScripts();
  self.skipWaiting();
  workbox.clientsClaim();
  workbox.registerRoute(
    "/",
    new workbox.NetworkFirst({
      cacheName: "start-url",
      plugins: [
        {
          cacheWillUpdate: async ({ request, response, event, state }) => {
            if (response && response.type === "opaqueredirect") {
              return new Response(response.body, {
                status: 200,
                statusText: "OK",
                headers: response.headers,
              });
            }
            return response;
          },
        },
      ],
    }),
    "GET"
  );
  workbox.registerRoute(
    /.*/i,
    new workbox.NetworkOnly({
      cacheName: "dev",
      plugins: [],
    }),
    "GET"
  );
});

// --- Hesar Web Push + offline-capable local deadline alarms ---
const ALARM_DB = "hesar-alarms";
const ALARM_STORE = "alarms";

function openAlarmDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(ALARM_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ALARM_STORE)) {
        db.createObjectStore(ALARM_STORE, { keyPath: "tag" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPutAlarm(alarm) {
  const db = await openAlarmDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALARM_STORE, "readwrite");
    tx.objectStore(ALARM_STORE).put(alarm);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDeleteAlarm(tag) {
  const db = await openAlarmDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALARM_STORE, "readwrite");
    tx.objectStore(ALARM_STORE).delete(tag);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbAllAlarms() {
  const db = await openAlarmDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALARM_STORE, "readonly");
    const req = tx.objectStore(ALARM_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function showAlarmNotification(alarm) {
  return self.registration.showNotification(alarm.title || "زنگ ددلاین", {
    body: alarm.body || "",
    tag: alarm.tag || "deadline",
    renotify: true,
    requireInteraction: true,
    data: { url: alarm.url || "/" },
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    silent: false,
    vibrate: [200, 100, 200, 100, 400],
  });
}

/** Fire any stored alarms whose time has arrived (works after SW wake while offline). */
async function flushDueAlarms() {
  const now = Date.now();
  const alarms = await idbAllAlarms();
  for (const alarm of alarms) {
    if (!alarm || !alarm.fireAtMs) continue;
    if (Number(alarm.fireAtMs) > now + 1500) continue;
    try {
      await showAlarmNotification(alarm);
      await idbDeleteAlarm(alarm.tag);
    } catch (_) {
      /* keep for retry on next wake */
    }
  }
}

async function scheduleAlarmRecord(alarm) {
  await idbPutAlarm(alarm);
  const fireAtMs = Number(alarm.fireAtMs);
  const delay = Math.max(0, fireAtMs - Date.now());

  // Best path for offline-at-exact-time: Notification Triggers (Chrome Android).
  const Trigger = self.TimestampTrigger;
  if (typeof Trigger === "function") {
    try {
      await self.registration.showNotification(alarm.title || "زنگ ددلاین", {
        body: alarm.body || "",
        tag: alarm.tag || "deadline",
        renotify: true,
        requireInteraction: true,
        data: { url: alarm.url || "/" },
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        silent: false,
        vibrate: [200, 100, 200, 100, 400],
        showTrigger: new Trigger(fireAtMs),
      });
      return;
    } catch (_) {
      /* fall through */
    }
  }

  // Fallback while SW stays alive; IndexedDB + flushDueAlarms covers later wakes.
  if (delay < 2147483647) {
    setTimeout(() => {
      void flushDueAlarms();
    }, delay);
  }
}

self.addEventListener("push", (event) => {
  let data = { title: "Plane", body: "", url: "/", tag: "plane", requireInteraction: false };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    try {
      data.body = event.data ? event.data.text() : "";
    } catch (__) {
      /* ignore */
    }
  }
  const options = {
    body: data.body || "",
    tag: data.tag || "plane",
    renotify: true,
    requireInteraction: !!data.requireInteraction,
    data: { url: data.url || "/" },
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    silent: false,
    vibrate: data.type === "deadline_alarm" || data.type === "assign" ? [200, 100, 200, 100, 400] : undefined,
  };
  event.waitUntil(Promise.all([self.registration.showNotification(data.title || "Plane", options), flushDueAlarms()]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await flushDueAlarms();
    })()
  );
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "hesar-deadline-alarms") {
    event.waitUntil(flushDueAlarms());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "hesar-deadline-alarms") {
    event.waitUntil(flushDueAlarms());
  }
});

self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "SCHEDULE_ALARM") {
    const alarm = {
      tag: msg.tag || "deadline",
      title: msg.title || "زنگ ددلاین",
      body: msg.body || "",
      url: msg.url || "/",
      fireAtMs: Number(msg.fireAtMs),
    };
    event.waitUntil(scheduleAlarmRecord(alarm));
  }
  if (msg.type === "CANCEL_ALARM" && msg.tag) {
    event.waitUntil(
      Promise.all([
        idbDeleteAlarm(msg.tag),
        self.registration.getNotifications({ tag: msg.tag }).then((list) => list.forEach((n) => n.close())),
      ])
    );
  }
  if (msg.type === "FLUSH_ALARMS") {
    event.waitUntil(flushDueAlarms());
  }
});
//# sourceMappingURL=sw.js.map
