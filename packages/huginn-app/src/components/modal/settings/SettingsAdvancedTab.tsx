import { SettingsTabProps } from "@/types";
import HuginnInput from "@components/input/HuginnInput";
import { useInputs } from "@hooks/useInputs";
import { useEffect } from "react";

export default function SettingsAdvancedTab(props: SettingsTabProps) {
   const { values, validateValues, inputsProps } = useInputs([
      { name: "serverAddress", required: false, default: props.settings.serverAddress },
   ]);

   useEffect(() => {
      if (validateValues() && props.onChange && props.settings.serverAddress !== values["serverAddress"].value) {
         props.onChange({ serverAddress: values.serverAddress.value });
         console.log({ ...props.settings, serverAddress: values.serverAddress.value });
      }
   }, [values]);

   return (
      <>
         <HuginnInput className="w-72" type="text" {...inputsProps.serverAddress}>
            <HuginnInput.Label>Server Address</HuginnInput.Label>
         </HuginnInput>
         <div className="text-text/50 mt-1 text-sm italic">*changing server ip requires a reload.</div>
      </>
   );
}
