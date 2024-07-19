export default function UserIconWithStatus(props: { size?: string; statusSize?: string; className?: string }) {
   const { size = "2.25rem", statusSize = "0.75rem", className } = props;
   return (
      <div className={`relative shrink-0 rounded-full ${className}`} style={{ width: size, height: size }}>
         <div className="absolute bottom-0 right-0 rounded-full bg-[#FFA000]" style={{ width: statusSize, height: statusSize }} />
      </div>
   );
}
