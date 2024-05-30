export default function MessageBox() {
   return (
      <div className="relative mx-5 flex w-full flex-wrap-reverse py-2">
         <form className="absolute w-full">
            <div className="flex h-full items-start rounded-3xl bg-tertiary p-2 ring-2 ring-background">
               <div className="mr-2 flex shrink-0 cursor-pointer items-center rounded-full bg-background p-1.5 transition-all hover:bg-white hover:bg-opacity-20 hover:shadow-xl">
                  <IconGravityUiPlus name="gravity-ui:plus" className="h-5 w-5 text-text" />
               </div>
               <div className="w-full grow-0 py-1">{/* <Editor /> */}</div>
               <div className="ml-2 flex gap-x-2">
                  <div className="h-8 w-8 rounded-full bg-background" />
                  <div className="h-8 w-8 rounded-full bg-background" />
                  <div className="h-8 w-8 rounded-full bg-background" />
               </div>
            </div>
         </form>
      </div>
   );
}
