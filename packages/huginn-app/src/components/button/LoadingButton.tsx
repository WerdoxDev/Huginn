import type { HuginnButtonProps } from "@/types";
import { omit } from "@huginn/shared";
import clsx from "clsx";

export default function LoadingButton(props: HuginnButtonProps & { loading: boolean; iconClassName?: string }) {
	return (
		<HuginnButton innerClassName="flex items-center justify-center" disabled={props.loading || props.disabled} {...omit(props, ["disabled"])}>
			{props.loading ? (
				<IconMingcuteLoading3Fill className={clsx("size-7 animate-spin text-text", props.iconClassName)} />
			) : (
				<div>{props.children}</div>
			)}
		</HuginnButton>
	);
}
