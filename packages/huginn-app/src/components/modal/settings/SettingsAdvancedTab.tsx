import { SettingsTabProps } from "@/types";
import HuginnInput from "@components/input/HuginnInput";
import { useInputs } from "@hooks/useInputs";
import { useEffect } from "react";

export default function SettingsAdvancedTab(props: SettingsTabProps) {
   const { values, validateValues, inputsProps } = useInputs([
      { name: "serverAddress", required: false, default: props.settings.serverAddress },
      { name: "cdnAddress", required: false, default: props.settings.cdnAddress },
   ]);

   useEffect(() => {
      if (validateValues() && props.onChange) {
         if (props.settings.serverAddress !== values.serverAddress.value) {
            props.onChange({ serverAddress: values.serverAddress.value });
         }
         if (props.settings.cdnAddress !== values.cdnAddress.value) {
            props.onChange({ cdnAddress: values.cdnAddress.value });
         }
      }
   }, [values]);

   return (
      <>
         <div className="mb-5">
            <HuginnInput className="w-72" type="text" {...inputsProps.serverAddress}>
               <HuginnInput.Label>Server Address</HuginnInput.Label>
            </HuginnInput>
            <div className="text-text/50 mt-1 text-sm italic">*changing server address requires a reload.</div>
         </div>
         <div>
            <HuginnInput className="w-72" type="text" {...inputsProps.cdnAddress}>
               <HuginnInput.Label>CDN Address</HuginnInput.Label>
            </HuginnInput>
            <div className="text-text/50 mt-1 text-sm italic">*changing cdn address requires a reload.</div>
         </div>
      </>
   );
}
