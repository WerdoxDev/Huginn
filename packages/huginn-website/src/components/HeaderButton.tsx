import { Link } from "@tanstack/react-router";
import { type MouseEvent } from "react";

type HeaderButtonProps = {
   link: string;
   text: string;
   onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

export default function HeaderButton({ link, text, onClick }: HeaderButtonProps) {
   return (
      <button onClick={onClick} className="text-left" type="button">
         <Link
            to={link}
            className={({ isActive }) =>
               `hover:text-accent text-2xl font-bold transition-all md:text-xl ${isActive ? "text-accent underline underline-offset-4" : ""}`
            }
         >
            {text}
         </Link>
      </button>
   );
}
