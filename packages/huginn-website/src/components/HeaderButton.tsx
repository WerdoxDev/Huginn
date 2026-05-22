import { type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";

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
          `text-2xl font-bold transition-all hover:text-accent md:text-xl ${
            isActive ? "text-accent underline underline-offset-4" : ""
          }`
        }
      >
        {text}
      </Link>
    </button>
  );
}
