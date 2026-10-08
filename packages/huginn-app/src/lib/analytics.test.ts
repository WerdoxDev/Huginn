import { Analytics, analytics, initAnalytics, reinitializeAnalytics, type LogLevel } from "@huginnjs/shared";
import { expect, it } from "vitest";

class TestAnalytics extends Analytics {
   public constructor(
      private readonly name: string,
      private readonly events: string[],
      private readonly onFlush?: () => Promise<void>,
   ) {
      super();
   }

   public log(_options: { body: string; level: LogLevel }): void {
      this.events.push(`log:${this.name}`);
   }

   public identify(): void {}
   public reset(): void {}

   public async flush(): Promise<void> {
      this.events.push(`flush:${this.name}`);
      await this.onFlush?.();
   }

   public async shutdown(): Promise<void> {
      this.events.push(`shutdown:${this.name}`);
   }

   public startActiveSpan<T>(_name: string, fn: (span: any) => T | Promise<T>): T | Promise<T> {
      return fn({});
   }

   public getActiveSpan(): undefined {
      return undefined;
   }

   public withRootContext<F extends () => ReturnType<F>>(fn: F): ReturnType<F> {
      return fn();
   }

   public getTraceparent(): string | undefined {
      return undefined;
   }
}

it("flushes and shuts down the current analytics before replacing it", async () => {
   const events: string[] = [];
   const current = new TestAnalytics("current", events);
   current.setDefaultAttributes({ instance: "one" });
   initAnalytics(current);

   let replacement: TestAnalytics | undefined;
   await reinitializeAnalytics(() => {
      events.push("create:replacement");
      replacement = new TestAnalytics("replacement", events);
      return replacement;
   });
   analytics.log({ body: "ready", level: "info" });

   expect(events).toEqual(["flush:current", "shutdown:current", "create:replacement", "log:replacement"]);
   expect(replacement?.defaultAttributes).toEqual({ instance: "one" });
});

it("provides a complete no-op span while analytics is being replaced", async () => {
   const events: string[] = [];
   let signalFlushStarted!: () => void;
   let releaseFlush!: () => void;
   const flushStarted = new Promise<void>((resolve) => (signalFlushStarted = resolve));
   const flushReleased = new Promise<void>((resolve) => (releaseFlush = resolve));
   const current = new TestAnalytics("current", events, async () => {
      signalFlushStarted();
      await flushReleased;
   });
   initAnalytics(current);

   const replacement = reinitializeAnalytics(() => new TestAnalytics("replacement", events));
   await flushStarted;

   try {
      const result = analytics.startActiveSpan("during-reinitialization", (span) => {
         expect(span.addEvent("initialize", { success: true })).toBe(span);
         expect(span.setAttributes({ reconnecting: true })).toBe(span);
         return "continued";
      });

      expect(result).toBe("continued");
   } finally {
      releaseFlush();
      await replacement;
   }
});
