import { HTMLInputTypeAttribute } from "react";

declare global {
   type StateCode = "none" | "default" | "error" | "success";

   type LoadingState = "none" | "loading" | "checking_update" | "updating";

   type InputState = {
      code: StateCode;
      text: string;
   };

   type InputField = {
      required: boolean;
      value: string;
   };

   type FieldProperty = {
      name: string;
      required: boolean;
      default?: string;
   };

   type FormStates = Record<string, InputState>;
   type FormFields = Record<string, InputField>;

   type MessageDetail = {
      state: StateCode;
      text: string;
      visible: boolean;
   };

   type BaseInputProps = {
      state: InputState;
      label?: string;
      type?: HTMLInputTypeAttribute;
      required?: boolean;
      defaultValue?: string;
   };

   type BaseButtonProps = {
      type?: "submit" | "reset" | "button" | undefined;
      contentClass?: string;
   };

   type ModalState = {
      isOpen: boolean;
   };

   type InfoModalState = {
      state: StateCode;
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
