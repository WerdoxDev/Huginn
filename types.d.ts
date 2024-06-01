import { HTMLInputTypeAttribute, ReactNode } from "react";
import { BaseEditor, BaseRange } from "slate";
import { ReactEditor } from "slate-react";

declare global {
   type StatusCode = "none" | "default" | "error" | "success";

   type LoadingState = "none" | "loading" | "checking_update" | "updating";

   type InputStatus = {
      code: StatusCode;
      text: string;
   };

   type InputValue = {
      required: boolean;
      value: string;
   };

   type InputOptions = {
      name: string;
      required: boolean;
      default?: string;
   };

   type InputProp = {
      status: InputStatus;
      value: string;
      required: boolean;
      onChange: (e: HTMLInputElement) => void;
   };

   type InputStatuses = Record<string, InputStatus>;
   type InputValues = Record<string, InputValue>;
   type InputProps = Record<string, InputProp>;

   type MessageDetail = {
      status: StatusCode;
      text: string;
      visible: boolean;
   };

   type HuginnInputProps = {
      children?: ReactNode;
      className?: string;
      status: InputStatus;
      type?: HTMLInputTypeAttribute;
      required?: boolean;
      value?: string;
      onChange?: (e: HTMLInputElement) => void;
      onFocus?: (focused: boolean) => void;
   };

   type HuginnButtonProps = {
      children?: ReactNode;
      type?: "submit" | "reset" | "button" | undefined;
      className?: string;
      disabled?: boolean;
      innerClassName?: string;
      onClick?: () => void;
   };

   type ModalState = {
      isOpen: boolean;
   };

   type InfoModalState = {
      state: StatusCode;
      text: string;
   } & ModalState;

   type UpdaterProgress = {
      chunkLength: number;
      contentLength: number;
   };

   type AppSettings = {
      serverAddress?: string;
   };

   type SettingsTab = {
      name: string;
      text: string;
      children?: SettingsTab[];
      icon?: ReactNode;
      component?: (props: { settings: AppSettings; onChange?: (value: AppSettings) => void }) => JSX.Element;
   };

   type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
}

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
   // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
   interface CustomTypes {
      Editor: CustomEditor;
      Element: CustomElement;
      Text: CustomText;
      Range: CustomRange;
   }
}
