import { BaseEditor, BaseRange } from "slate";
import { ReactEditor } from "slate-react";

type CustomEditor = BaseEditor & ReactEditor;

type ParagraphElement = {
   type: "paragraph";
   children: CustomText[];
};

type CustomElement = ParagraphElement;

type TextFormats = { bold?: boolean; italic?: boolean; underline?: boolean; mark?: boolean; spoiler?: boolean };
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
