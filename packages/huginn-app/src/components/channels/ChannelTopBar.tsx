import MobileMenuButton from "@components/button/MobileMenuButton";
import TopBar from "@components/TopBar";

export default function ChannelTopBar() {
   return (
      <TopBar>
         <MobileMenuButton className="mr-3" />
      </TopBar>
   );
}
