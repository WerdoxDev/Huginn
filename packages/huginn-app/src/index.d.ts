import type { Snowflake } from "@huginn/shared";
import type { BaseEditor, BaseRange, Descendant } from "slate";
import type { ReactEditor } from "slate-react";

type CustomEditor = BaseEditor & ReactEditor;

type ParagraphElement = {
	type: "paragraph";
	children: Descendant[];
};

type SpoilerElement = {
	type: "spoiler";
	children: Descendant[];
};

type LinkElement = {
	type: "link";
	children: Descendant[];
	url?: string;
};

type CodeElement = {
	type: "code";
	children: Descendant[];
	code: string;
	language?: string;
};

type EmbedElement = {
	type: "embed";
	title?: string;
	description?: string;
	url?: string;
	image?: string;
	width?: number;
	height?: number;
	children: Descendant[];
};

type CustomElement = ParagraphElement | SpoilerElement | EmbedElement | LinkElement | CodeElement;

type TextFormats = {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	mark?: boolean;
	spoiler?: boolean;
	link?: boolean;
	codeToken?: string;
	codeLanguage?: boolean;
};
type FormattedText = { text: string } & TextFormats;

type CustomText = FormattedText;
type CustomRange = BaseRange & TextFormats & { text?: string };

declare module "slate" {
	interface CustomTypes {
		Editor: CustomEditor;
		Element: CustomElement;
		Text: CustomText;
		Range: CustomRange;
	}
}

declare global {
	// interface globalThis {
	var __TAURI_INTERNALS__: unknown;
	// }
}
