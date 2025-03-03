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
	thumbnail?: { url: string; width?: number; height?: number };
	video?: { url: string; width?: number; height?: number };
	title?: string;
	description?: string;
	url?: string;
	children: Descendant[];
};

type AttachmentElement = {
	type: "attachment";
	description?: string;
	url: string;
	width?: number;
	height?: number;
	filename: string;
	size: number;
	children: Descendant[];
	contentType: string;
};

type CustomElement = ParagraphElement | SpoilerElement | EmbedElement | LinkElement | CodeElement | AttachmentElement;

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
