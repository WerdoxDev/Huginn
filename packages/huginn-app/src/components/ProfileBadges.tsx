import type { APIBadge } from "@huginnjs/shared";

import Tooltip from "@components/tooltip/Tooltip";

export default function ProfileBadges({ badges }: { badges: APIBadge[] }) {
   if (badges.length === 0) return null;

   return (
      <div className="mt-1.5 flex gap-x-1.5">
         {badges.map((badge) => (
            <Tooltip key={badge.id}>
               <Tooltip.Trigger>
                  <div className="flex size-5.5 items-center justify-center rounded-md" style={{ backgroundColor: `${badge.color}44` }}>
                     {badge.icon && <img src={badge.icon} alt={badge.id} className="size-4 object-contain" />}
                  </div>
               </Tooltip.Trigger>
               <Tooltip.Content>{badge.description}</Tooltip.Content>
            </Tooltip>
         ))}
      </div>
   );
}
