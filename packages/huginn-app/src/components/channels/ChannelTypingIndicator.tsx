import type { Snowflake } from "@huginnjs/shared";

import LoadingDot from "@components/LoadingDot";
import { Transition } from "@headlessui/react";
import { useChannelRecipients } from "@hooks/api-hooks/channelHooks";
import { useTypingStore } from "@stores/typingStore";
import { useMemo, useRef } from "react";

export default function ChannelTypingIndicator(props: { channelId: Snowflake }) {
   const { typings } = useTypingStore();
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

      lastValue.current = {
         count: channelTypings.length,
         recipientsText,
         channelId: props.channelId,
      };
      return lastValue.current;
   }, [typings]);

   return (
      <Transition show={channelTypings.length > 0 && channelId === props.channelId}>
         <div className="bg-surface-alt border-surface pointer-events-none absolute bottom-full left-2 z-20 flex max-w-[calc(100%-1rem)] items-center gap-x-1 rounded-lg border px-2 py-2 text-sm transition-opacity data-closed:opacity-0">
            <span className="box-exact text-text min-w-0 truncate font-medium">{recipientsText}</span>
            {count === 1 && <span className="box-exact text-text/70 shrink-0">is typing</span>}
            {count > 1 && <span className="box-exact text-text/70 shrink-0">are typing</span>}
            <LoadingDot loadingClassName="w-1 h-1" className="box-exact ml-0.5 shrink-0 gap-x-0.5" />
         </div>
      </Transition>
   );
}
