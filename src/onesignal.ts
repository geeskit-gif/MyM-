const ONESIGNAL_APP_ID = "dd7d44ec-c192-4c67-bbde-73d62b85bc56";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => Promise<void> | void>;
  }
}

let readyPromise: Promise<any> | null = null;

export function initOneSignal() {
  if (readyPromise) return readyPromise;

  if (!window.OneSignalDeferred) {
    window.OneSignalDeferred = [];
  }

  readyPromise = new Promise((resolve) => {
    window.OneSignalDeferred!.push(async (OneSignal) => {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerPath: "MyM-/OneSignalSDKWorker.js",
        serviceWorkerParam: {
          scope: "/MyM-/",
        },
      });
      resolve(OneSignal);
    });
  });

  return readyPromise;
}

export async function requestOneSignalPermission() {
  const OneSignal = await initOneSignal();
  await OneSignal.Notifications.requestPermission();
  return OneSignal;
}
