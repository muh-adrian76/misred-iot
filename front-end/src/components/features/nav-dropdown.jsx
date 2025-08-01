// Komponen client-side untuk dropdown navigation
"use client"

// Import icons dari Lucide React
import { Folder, Forward, MoreHorizontal, Trash2 } from "lucide-react";

// Import komponen UI untuk dropdown menu
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import komponen UI untuk sidebar
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

/**
 * Komponen Navigation Dropdown untuk project management
 * Menampilkan list projects dengan dropdown actions untuk setiap item
 * @param {Object} props - Props komponen
 * @param {Array} props.projects - Array project objects dengan name, url, icon
 * @returns {JSX.Element} Sidebar group dengan dropdown menu untuk projects
 */
export function NavDropdown({
  projects // Array of project objects
}) {
  // Hook untuk mendapatkan sidebar state (mobile/desktop)
  const { isMobile } = useSidebar()

  return (
    // Sidebar group yang hidden saat sidebar dalam mode icon-only
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {/* Group label untuk section projects */}
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      
      <SidebarMenu>
        {/* Map through projects array untuk render menu items */}
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            {/* Main menu button dengan link ke project */}
            <SidebarMenuButton asChild>
              <a href={item.url}>
                {/* Project icon */}
                <item.icon />
                {/* Project name */}
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            
            {/* Dropdown menu untuk project actions */}
            <DropdownMenu>
              {/* Trigger button - tampil saat hover */}
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span> {/* Screen reader text */}
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              
              {/* Dropdown content dengan conditional positioning */}
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"} // Position berdasarkan device
                align={isMobile ? "end" : "start"} // Alignment berdasarkan device
              >
                {/* View Project Action */}
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                
                {/* Share Project Action */}
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                
                {/* Separator line */}
                <DropdownMenuSeparator />
                
                {/* Delete Project Action (destructive) */}
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        
        {/* "More" menu item untuk additional projects */}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
      </SidebarMenu>
    </SidebarGroup>
  );
}
