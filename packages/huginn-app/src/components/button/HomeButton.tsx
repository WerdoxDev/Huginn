import { Link } from "@tanstack/react-router";

export default function HomeButton() {
   return (
      <Link
         to="/channels/@me"
         className="bg-text group m-3.5 flex h-12 w-12 cursor-pointer items-center justify-center rounded-3xl transition-all hover:scale-105 hover:rounded-2xl active:translate-y-0.5"
      >
         <IconFa6SolidCrow className="text-background h-9 w-9 transition-all group-hover:-rotate-12 group-active:rotate-6" />
      </Link>
   );
}
