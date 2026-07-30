import { getEmojiBySlug } from "@huginnjs/shared";
import { useMemo, useState } from "react";

const RECENT_EMOJIS_KEY = "recent-emojis";
const RECENT_MAX = 32;

export function useRecentEmojis() {
   const [recentEmojiSlugs, setRecentEmojis] = useState<string[]>(() => {
      const recent = JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY) ?? "[]") as string[];
      return recent;
   });

   const recentEmojis = useMemo(() => {
      return recentEmojiSlugs.map((slug) => getEmojiBySlug(slug)).filter((x) => x !== undefined);
   }, [recentEmojiSlugs]);

   function addRecentEmoji(slug: string) {
      setRecentEmojis((prev) => {
         const newRecent = [slug, ...prev.filter((s) => s !== slug)].slice(0, RECENT_MAX);
         localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(newRecent));
         return newRecent;
      });
   }

   return { recentEmojis, addRecentEmoji };
}
