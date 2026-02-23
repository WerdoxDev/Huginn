import clsx from "clsx";
import { useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import HuginnInput from "./HuginnInput";

export default function OTPInput() {
   const inputContext = useContext(HuginnInput.InputContext);
   const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
   const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
   const mockInputRef = useRef<HTMLInputElement | null>(null);

   useImperativeHandle(inputContext.ref, () => mockInputRef.current!);
   // Sync with react-hook-form

   useEffect(() => {
      if (!mockInputRef.current) return;

      const code = digits.join("");
      const event = new Event("input", { bubbles: true });
      Object.defineProperty(event, "target", {
         writable: false,
         value: { value: code, name: inputContext.name },
      });

      mockInputRef.current.value = code;
      inputContext.onChange?.(event as any);
   }, [digits]);

   function handleInputChange(index: number, value: string) {
      if (!/^\d*$/.test(value)) return;

      const newDigits = [...digits];
      newDigits[index] = value.slice(-1);
      setDigits(newDigits);

      // Auto-focus next input
      if (value && index < 5) {
         inputRefs.current[index + 1]?.focus();
      }
   }

   function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Backspace") {
         e.preventDefault();
         const newDigits = [...digits];

         if (digits[index]) {
            newDigits[index] = "";
            setDigits(newDigits);
         } else if (index > 0) {
            newDigits[index - 1] = "";
            setDigits(newDigits);
            inputRefs.current[index - 1]?.focus();
         }
      } else if (e.key === "ArrowLeft" && index > 0) {
         e.preventDefault();
         inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < 5) {
         e.preventDefault();
         inputRefs.current[index + 1]?.focus();
      }
   }

   function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

      if (!/^\d*$/.test(pastedText)) return;

      const newDigits = Array(6).fill("");
      for (let i = 0; i < pastedText.length; i++) {
         newDigits[i] = pastedText[i];
      }
      setDigits(newDigits);

      if (pastedText.length === 6) {
         inputRefs.current[5]?.focus();
      } else if (pastedText.length > 0) {
         inputRefs.current[pastedText.length]?.focus();
      }
   }

   return (
      <div className="flex justify-center gap-2 disabled:cursor-not-allowed">
         <input
            ref={mockInputRef}
            className="absolute h-0 w-0"
            onChange={inputContext.onChange}
            value={inputContext.value}
            id={inputContext.id}
            name={inputContext.name}
            onFocus={() => {
               inputRefs.current[0]?.focus();
            }}
         />
         {digits.map((digit, index) => (
            <input
               key={index}
               ref={(el) => {
                  inputRefs.current[index] = el;
               }}
               type="text"
               inputMode="numeric"
               maxLength={1}
               value={digit}
               onChange={(e) => handleInputChange(index, e.target.value)}
               onKeyDown={(e) => handleKeyDown(index, e)}
               onPaste={handlePaste}
               autoFocus={inputContext.autoFocus}
               className={clsx(
                  "bg-surface-alt w-full rounded-lg p-2 text-center text-lg font-semibold text-white transition-colors outline-none",
                  !["none", "default"].includes(inputContext.message.status) && ["ring", HuginnInput.STATUS_RING_COLORS[inputContext.message.status]],
               )}
            />
         ))}
      </div>
   );
}
