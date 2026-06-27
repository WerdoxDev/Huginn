import { analytics } from "@huginn/shared";
import { Notification } from "electron";

export class NotificationController {
   private current: Notification | null = null;

   public sendNotification(options: Electron.NotificationConstructorOptions, onClick?: () => void) {
      analytics.startActiveSpan("notificationController.sendNotification", (span) => {
         try {
            const notification = new Notification(options);
            if (options.title) span.setAttribute("notification.title", options.title);
            if (options.body) span.setAttribute("notification.body", options.body);
            if (typeof options.icon === "string") span.setAttribute("notification.icon", options.icon);
            if (this.current) span.setAttribute("notification.replacesExisting", true);
            if (onClick) {
               notification.on("click", onClick);
            }

            this.current?.close();
            this.current = notification;
            notification.show();
         } finally {
            span.end();
         }
      });
   }
}
