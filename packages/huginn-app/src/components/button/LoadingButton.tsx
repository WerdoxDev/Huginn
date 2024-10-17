import type { HuginnButtonProps } from "@/types.ts";
import HuginnButton from "@components/button/HuginnButton.tsx";
import { omit } from "@huginn/shared";

export default function LoadingButton(props: HuginnButtonProps & { loading: boolean }) {
	return (
		<HuginnButton innerClassName="flex items-center justify-center" disabled={props.loading || props.disabled} {...omit(props, ["disabled"])}>
			{props.loading ? <IconSvgSpinners3DotsFade className="absolute h-8 w-8 text-text" /> : <div className="absolute">{props.children}</div>}
		</HuginnButton>
	);
}
