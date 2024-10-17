import type { HuginnButtonProps } from "@/types";
import { omit } from "@huginn/shared";

export default function LoadingButton(props: HuginnButtonProps & { loading: boolean }) {
	return (
		<HuginnButton innerClassName="flex items-center justify-center" disabled={props.loading || props.disabled} {...omit(props, ["disabled"])}>
			{props.loading ? <IconSvgSpinners3DotsFade className="h-8 w-8 text-text" /> : <div>{props.children}</div>}
		</HuginnButton>
	);
}
