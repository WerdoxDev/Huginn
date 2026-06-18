import { PushNotifications } from "@capacitor/push-notifications";
import { analytics } from "@huginn/shared";
import { presenceStore } from "@stores/presenceStore";
import { windowStore } from "@stores/windowStore";

import { router } from "@/main";

export async function initNotifications() {
   const store = windowStore.getState();

   if (store.environment === "android") {
      return await initMobileNotifications();
   } else if (store.environment === "desktop") {
      return initElectronNotifications();
   }
}

router.subscribe("onBeforeNavigate", ({ toLocation }) => {
   console.log("TO LOCATION:", toLocation);
});

async function initMobileNotifications() {
   const registration = new Promise<string>((res, rej) => {
      PushNotifications.addListener("registration", (token) => {
         analytics.log({ body: "push notification registered", attributes: { token: token.value }, level: "info" });
         res(token.value);
      });

      PushNotifications.addListener("registrationError", (error) => {
         analytics.log({ body: "push notification registration error", attributes: { error: error.error }, level: "error" });
         rej(error);
      });
   });

   await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      analytics.log({ body: "push notification received", attributes: { notification }, level: "info" });
   });

   await PushNotifications.addListener("pushNotificationActionPerformed", async (notification) => {
      analytics.log({ body: "push notification action performed", attributes: { notification }, level: "info" });

      if (router.history.location.pathname === "/app/") {
         sessionStorage.setItem(
            "redirect",
            JSON.stringify({ pathname: `/channels/@me/${notification.notification.data.channelId}`, requiresAuth: true }),
         );
      } else {
         await router.navigate({ to: `/channels/@me/$channelId`, params: { channelId: notification.notification.data.channelId } });
      }
   });

   let status = await PushNotifications.checkPermissions();
   if (status.receive === "prompt") {
      status = await PushNotifications.requestPermissions();
   }

   if (status.receive !== "granted") {
      analytics.log({ body: "push notification permission not granted", level: "warn" });
      return;
   }

   await PushNotifications.createChannel({
      id: "messages",
      name: "Messages",
      visibility: 1,
      lights: true,
      importance: 4,
      description: "Instant messages",
      vibration: true,
   });

   await PushNotifications.register();

   return registration;
}

function initElectronNotifications() {
   window.electronAPI.onNotificationClicked(async (_, payload) => {
      analytics.log({ body: "desktop notification clicked", attributes: { payload }, level: "info" });

      window.electronAPI.showMain();
      window.electronAPI.focusMain();

      await router.navigate({ to: `/channels/@me/$channelId`, params: { channelId: payload } });
   });
}

let canSend = true;

export function sendNotification(payload: string, title: string, text: string, icon?: string) {
   const thisPresence = presenceStore.getState().thisPresence;

   if (!canSend || thisPresence.status === "dnd") {
      return;
   }

   window.electronAPI.sendNotification(title, text, payload, icon);
   canSend = false;
   setTimeout(() => {
      canSend = true;
   }, 3000);
}
