import { Link } from "@tanstack/react-router";
import { type MouseEvent } from "react";

type HeaderButtonProps = {
   link: string;
   text: string;
   onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
   anchor?: boolean;
};

export default function HeaderButton({ link, text, onClick, anchor }: HeaderButtonProps) {
   return (
      <button onClick={onClick} className="text-left" type="button">
         {anchor ? (
            <a href={link} className="hover:text-primary-500 text-2xl font-bold transition-all lg:text-xl">
               {text}
            </a>
         ) : (
            <Link
               to={link}
               activeProps={{ className: "text-primary-500 underline underline-offset-4" }}
               className="hover:text-primary-500 text-2xl font-bold transition-all lg:text-xl"
            >
               {text}
            </Link>
         )}
      </button>
   );
}
