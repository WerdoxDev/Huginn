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
   onChange: (e: HTMLInputElement) => void;
};

type InputStatuses = Record<string, InputStatus>;
type InputValues = Record<string, InputValue>;
type InputProps = Record<string, InputProp>;

type MessageDetail = {
   state: StatusCode;
   text: string;
   visible: boolean;
};

type BaseInputProps = {
   state: InputStatus;
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
