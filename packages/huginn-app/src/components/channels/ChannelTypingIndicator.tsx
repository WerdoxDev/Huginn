import LoadingDot from "@components/LoadingDot";
import { Transition } from "@headlessui/react";
import { useChannelRecipients } from "@hooks/api-hooks/channelHooks";
import type { Snowflake } from "@huginn/shared";
import { useTypings } from "@stores/typingStore";
import { useMemo, useRef } from "react";

export default function ChannelTypingIndicator(props: { channelId: Snowflake }) {
   const { typings } = useTypings();
   const { recipients } = useChannelRecipients(props.channelId, undefined);

   const lastValue = useRef<{ count: number; recipientsText: string; channelId: Snowflake }>(undefined);

   const channelTypings = useMemo(
      () => typings.filter((x) => x.channelId === props.channelId).map((x) => recipients?.find((y) => y.id === x.userId)),
      [typings, props.channelId],
   );

   const { count, recipientsText, channelId } = useMemo(() => {
      if (typings.length === 0 && lastValue.current) {
         return lastValue.current;
      }

      const recipientsText = channelTypings.map((x) => x?.displayName).join(", ");

      lastValue.current = { count: channelTypings.length, recipientsText, channelId: props.channelId };
      return lastValue.current;
   }, [typings]);

   return (
      <Transition show={channelTypings.length > 0 && channelId === props.channelId}>
         <div className="bg-linear-to-t from-surface-deep data-closed:opacity-0 pointer-events-none absolute bottom-0 left-0 right-5 z-10 flex h-8 items-end from-50% to-transparent pb-1 pl-4 text-sm transition-opacity">
            <span className="text-text font-bold">{recipientsText}&nbsp;</span>
            {count === 1 && <span className="text-text/70">is typing</span>}
            {count > 1 && <span className="text-text/70">are typing</span>}
            <LoadingDot loadingClassName="w-1 h-1" className="mb-1.5 ml-1 gap-x-0.5" />
         </div>
      </Transition>
   );
}
