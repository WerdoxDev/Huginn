import { Link } from "@tanstack/react-router";

export default function HomeButton() {
   return (
      <Link
         to="/channels/@me"
         className="group m-3.5 flex h-12 w-12 cursor-pointer items-center justify-center rounded-3xl bg-text transition-all hover:scale-105 hover:rounded-2xl active:translate-y-0.5"
      >
         <IconFa6SolidCrow className="h-9 w-9 text-background transition-all group-hover:-rotate-12 group-active:rotate-6" />
      </Link>
   );
}
