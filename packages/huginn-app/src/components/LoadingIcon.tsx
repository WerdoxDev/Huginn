import clsx from "clsx";

export default function LoadingIcon(props: { className?: string }) {
   return <IconMingcuteLoading3Fill className={clsx("text-text animate-spin", props.className)} />;
}
