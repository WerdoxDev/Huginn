export default function HuginnButton(props: HuginnButtonProps) {
   return (
      <button
         className={`select-none rounded-md outline-none transition-colors hover:bg-opacity-80 enabled:active:bg-opacity-50  ${props.className}`}
         type={props.type}
         disabled={props.disabled}
         onClick={() => props.onClick && props.onClick()}
      >
         <div className={`text-background opacity-100 ${props.innerClassName}`}>{props.children}</div>
      </button>
   );
}
