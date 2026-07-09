import { EventEmitter } from "@huginn/shared";

export class SharedWebsocket<Events> extends EventEmitter<Events> {
   /**
    * Waits for any of the specified events to occur and resolves with their data.
    *
    * @typeParam K - The keys of the Events interface representing event names.
    * @param events - An array of event names to listen for.
    * @returns A promise that resolves to either:
    * - An object containing the event name and data if `waitForAny` is true.
    * - An array of such objects (one for each event) if `waitForAny` is false or omitted.
    */
   public async waitForAnyEvents<K extends keyof Events>(
      events: K[],
      // ): Promise<WaitForAny extends true ? { event: K; data: Events[K] } : Array<{ event: K; data: Events[K] }>> {
   ): Promise<{ event: K; data: Events[K] }> {
      // if (waitForAny) {
      const result = await Promise.race(
         events.map(
            (event) =>
               new Promise<{ event: K; data: Events[K] }>((resolve) => {
                  const unlisten = this.listen(event, (data: Events[K]) => {
                     unlisten();
                     resolve({ event, data });
                  });
               }),
         ),
      );

      return result as { event: K; data: Events[K] };
      // }

      // const results = await Promise.all(
      //    events.map(
      //       (event) =>
      //          new Promise<{ event: K; data: Events[K] }>((resolve) => {
      //             const unlisten = this.listen(event, (data: Events[K]) => {
      //                unlisten();
      //                resolve({ event, data });
      //             });
      //          }),
      //    ),
      // );

      // return results as WaitForAny extends true ? { event: K; data: Events[K] } : Array<{ event: K; data: Events[K] }>;
   }
}
