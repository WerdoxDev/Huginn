import { HTMLInputTypeAttribute, ReactNode } from "react";

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
      icon?: string;
      // component?: Component;
      isGroup: boolean;
   };
}
