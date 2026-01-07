import HuginnIcon from "@components/HuginnIcon";
import { NavLink } from "react-router";

export default function HomeButton() {
   return (
      <NavLink
         to="/channels/@me"
         className="bg-text group flex h-12 w-12 cursor-pointer items-center justify-center rounded-3xl transition-all hover:scale-105 hover:rounded-2xl active:translate-y-0.5"
      >
         <HuginnIcon className="text-surface size-8 transition-all group-hover:-rotate-12 group-active:rotate-6" />
      </NavLink>
   );
}
