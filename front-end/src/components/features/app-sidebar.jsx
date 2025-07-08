import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { brandLogo } from "@/lib/helper";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";

export default function AppSidebar({ sidebarMenu = [], pathname, isMobile, logoFont, ...props }) {
  const sidebarContent = (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader className="border-b-2">
        <div className="flex gap-3 items-center">
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <img src={brandLogo} alt="Logo" className="size-6" />
          </div>
          <div className="grid flex-1 text-left text-lg leading-tight">
            <h1 className={`truncate text-2xl font-bold tracking-wide ${logoFont}`}>
              MiSREd-IoT
            </h1>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {sidebarMenu.map((item) => {
              const isActive = pathname === item.url;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="transition-all font-semibold duration-200"
                  >
                    <Link href={item.url} aria-disabled={item.disabled}>
                      {item.icon && <item.icon />}
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );

  if (isMobile) {
    return <>{sidebarContent}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
    >
      {sidebarContent}
    </motion.div>
  );
}
