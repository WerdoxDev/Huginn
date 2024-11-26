import type { ThemeType } from "@/types";
import clsx from "clsx";

import ceruleanOutlinedUrl from "@/assets/huginn-cerulean-outlined.png";
import ceruleanUrl from "@/assets/huginn-cerulean.png";
import charcoalOutlinedUrl from "@/assets/huginn-charcoal-outlined.png";
import charcoalUrl from "@/assets/huginn-charcoal.png";
import coffeeOutlinedUrl from "@/assets/huginn-coffee-outlined.png";
import coffeeUrl from "@/assets/huginn-coffee.png";
import eggplantOutlinedUrl from "@/assets/huginn-eggplant-outlined.png";
import eggplantUrl from "@/assets/huginn-eggplant.png";
import pinegreenOutlinedUrl from "@/assets/huginn-pinegreen-outlined.png";
import pinegreenUrl from "@/assets/huginn-pinegreen.png";
import textOutlinedUrl from "@/assets/huginn-text-outlined.png";
import textUrl from "@/assets/huginn-text.png";

type ModifiedThemeType = ThemeType | "text";

const iconSources: Record<ModifiedThemeType, string[]> = {
	cerulean: [ceruleanUrl, ceruleanOutlinedUrl],
	"pine green": [pinegreenUrl, pinegreenOutlinedUrl],
	eggplant: [eggplantUrl, eggplantOutlinedUrl],
	coffee: [coffeeUrl, coffeeOutlinedUrl],
	charcoal: [charcoalUrl, charcoalOutlinedUrl],
	text: [textUrl, textOutlinedUrl],
};

export default function HuginnIcon(props: { className?: string; overrideTheme?: ModifiedThemeType; outlined?: boolean }) {
	const settings = useSettings();

	useEffect(() => {
		console.log(settings.theme);
	}, [settings]);
	const source = useMemo(() => iconSources[props.overrideTheme ?? settings.theme], [props.overrideTheme, settings]);

	return <img alt="huginn-icon" src={source[props.outlined ? 1 : 0]} className={clsx(props.className)} />;
}