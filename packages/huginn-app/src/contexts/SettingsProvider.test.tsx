import { PushNotifications } from "@lib/capacitor/push-notification-plugin";
import { defaultInstanceUrls } from "@lib/instances";
import { clientStore } from "@stores/clientStore";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsProvider from "./SettingsProvider";

const mocks = vi.hoisted(() => ({
   environment: "android",
   mutate: vi.fn(),
}));

vi.mock("@hooks/mutations/useEditSettings", () => ({
   useEditSettings: () => ({ mutate: mocks.mutate }),
}));

vi.mock("@stores/windowStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/windowStore")>()),
   useHuginnWindow: () => ({ environment: mocks.environment }),
}));

vi.mock("@lib/capacitor/push-notification-plugin", () => ({
   PushNotifications: {
      setNotificationsEnabled: vi.fn().mockResolvedValue(undefined),
      setDefaultNotificationColor: vi.fn().mockResolvedValue(undefined),
      setCdnHostname: vi.fn().mockResolvedValue(undefined),
   },
}));

describe("SettingsProvider notification CDN", () => {
   beforeEach(() => {
      mocks.environment = "android";
      vi.clearAllMocks();
      clientStore.setState({ urls: undefined });
   });

   afterEach(() => {
      clientStore.setState({ urls: undefined });
   });

   it("waits for instance discovery before configuring the Android notification CDN", () => {
      render(<SettingsProvider>App</SettingsProvider>);

      expect(PushNotifications.setCdnHostname).not.toHaveBeenCalled();

      const urls = defaultInstanceUrls("https://instance.example");
      act(() => clientStore.setState({ urls }));

      expect(PushNotifications.setCdnHostname).toHaveBeenCalledExactlyOnceWith({ hostname: urls.cdn });
   });

   it("updates the Android notification CDN when the selected instance changes", () => {
      const firstUrls = defaultInstanceUrls("https://first.example");
      clientStore.setState({ urls: firstUrls });
      render(<SettingsProvider />);

      const secondUrls = defaultInstanceUrls("https://second.example");
      act(() => clientStore.setState({ urls: secondUrls }));

      expect(PushNotifications.setCdnHostname).toHaveBeenNthCalledWith(1, { hostname: firstUrls.cdn });
      expect(PushNotifications.setCdnHostname).toHaveBeenNthCalledWith(2, { hostname: secondUrls.cdn });
      expect(PushNotifications.setCdnHostname).toHaveBeenCalledTimes(2);
   });

   it("does not configure the native notification CDN outside Android", () => {
      mocks.environment = "browser";
      clientStore.setState({ urls: defaultInstanceUrls("https://instance.example") });

      render(<SettingsProvider />);

      expect(PushNotifications.setCdnHostname).not.toHaveBeenCalled();
   });
});
