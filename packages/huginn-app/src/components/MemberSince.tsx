import { snowflake } from "@huginn/shared";
import { createScope, createTimeline, splitText, stagger, type Scope } from "animejs";
import moment from "moment";
import { useEffect, useMemo, useRef } from "react";

export default function MemberSince({ userId }: { userId: string }) {
   const sinceText = useRef<HTMLDivElement>(null);
   const daysText = useRef<HTMLDivElement>(null);
   const root = useRef<HTMLDivElement>(null);
   const scope = useRef<Scope>(null);

   const created = useMemo(() => {
      const ts = snowflake.getTimestamp(userId);
      return new Date(ts);
   }, [userId]);

   const daysSince = useMemo(() => {
      return Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
   }, [created]);

   const formatted = useMemo(() => {
      return moment(created).format("D MMMM YYYY");
   }, [created]);

   useEffect(() => {
      if (!sinceText.current) return;

      scope.current = createScope({ root }).add(() => {
         if (!sinceText.current || !daysText.current) return;
         const { chars: sinceChars } = splitText(sinceText.current, { chars: { wrap: "clip" } });
         const { chars: daysChars } = splitText(daysText.current, { chars: { wrap: "clip" } });
         const timeline = createTimeline({ loop: true, loopDelay: 2000, delay: 1000 });
         timeline
            .label("start")
            .add(
               sinceChars,
               {
                  y: ["0rem", "-0.1rem", "0rem"],
                  loop: 1,
                  loopDelay: 50,
               },
               stagger(150, { from: "center" }),
            )
            .add(
               daysChars,
               {
                  delay: 1000,
                  y: ["0rem", "-0.1rem", "0rem"],
                  loop: 1,
                  loopDelay: 50,
               },
               stagger(150, { from: "center" }),
            );
      });

      return () => {
         scope.current?.revert();
      };
   }, []);

   return (
      <div className="flex flex-col items-end" ref={root}>
         <div className="text-text/40 text-tiny font-semibold uppercase">"Huginning" since</div>
         <div className="text-text text-sm font-medium" ref={sinceText}>
            {formatted}
         </div>
         <div className="mt-1 flex items-center gap-x-1">
            <div className="bg-positive-400 size-1.5 animate-pulse rounded-full" />
            <span className="text-positive-400 text-xs font-bold" ref={daysText}>
               {daysSince} days strong
            </span>
         </div>
      </div>
   );
}
