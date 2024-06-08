export default function HuginnButton(props: HuginnButtonProps) {
   return (
      <button
         className={`select-none rounded-md outline-none transition-colors hover:bg-opacity-80 enabled:active:bg-opacity-50 disabled:cursor-not-allowed ${props.className}`}
         type={props.type}
         disabled={props.disabled}
         onClick={props.onClick}
      >
         <div className={`text-text opacity-100 ${props.innerClassName}`}>{props.children}</div>
      </button>
   );
}
