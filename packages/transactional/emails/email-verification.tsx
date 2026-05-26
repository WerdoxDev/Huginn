import * as React from "react";
import { Html, Head, Body, Tailwind, Img, Font, Text } from "react-email";

export default function Email() {
   return (
      <Tailwind>
         <Html>
            <Head>
               <Font fontFamily="sans-serif" fallbackFontFamily={"sans-serif"} />
            </Head>
            <Body>
               <div className="mx-auto max-w-lg">
                  <div className="my-10 rounded-3xl bg-[#1f1f1f] px-8 py-8">
                     <Img src="https://huginn.dev/logo/text_outline_thick.png" className="mx-auto mb-8" width={100} height={100} alt="huginn-logo" />
                     <Text className="my-0 text-center text-xl font-semibold text-white">Verification code</Text>
                     <Text className="mt-0 mb-8 text-center text-lg text-white/80">Enter this code in huginn to verify this email address</Text>
                     <div className="mx-auto w-full rounded-xl bg-[#EBEBD3] py-4">
                        <Text className="text-center font-mono text-3xl font-bold tracking-widest text-[#1f1f1f]">456789</Text>
                     </div>
                  </div>
               </div>
            </Body>
         </Html>
      </Tailwind>
   );
}
