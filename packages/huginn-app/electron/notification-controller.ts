import { Notification } from "electron";

export class NotificationController {
   private queue: Array<Notification> = [];
   constructor() {}

   public sendNotification(options: Electron.NotificationConstructorOptions, onClick?: () => void) {
      const notification = new Notification(options);

      if (onClick) {
         notification.on("click", onClick);
      }

      this.queue.push(notification);
      if (this.queue.length === 1) {
         notification.show();
      } else {
         const current = this.queue[0];
         current.close();
         this.queue.shift();
         notification.show();
      }
   }
}
