import type { HuginnButtonProps } from "@/types";
import { omit } from "@huginn/shared";

export default function LoadingButton(props: HuginnButtonProps & { loading: boolean }) {
	return (
		<HuginnButton innerClassName="flex items-center justify-center" disabled={props.loading || props.disabled} {...omit(props, ["disabled"])}>
			{props.loading ? <IconMingcuteLoading3Fill className="animate-spin size-8 text-text" /> : <div>{props.children}</div>}
		</HuginnButton>
	);
}
