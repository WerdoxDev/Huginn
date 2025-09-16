import type { Duration } from "moment";
import moment from "moment";
import { useEffect, useState } from "react";

export function useElapsedTime(startTime?: number) {
   const [currentTime, setCurrentTime] = useState(new Date());

   useEffect(() => {
      const timer = setInterval(() => {
         setCurrentTime(new Date());
      }, 1000);

      return () => {
         clearInterval(timer);
      };
   }, [startTime]);

   function getFormattedDuration() {
      const duration = moment.duration(moment(currentTime).diff(startTime));
      return `${Math.floor(duration.asHours()).toString().padStart(2, "0")}:${duration.minutes().toString().padStart(2, "0")}:${duration.seconds().toString().padStart(2, "0")}`;
   }

   return { getFormattedDuration };
}
