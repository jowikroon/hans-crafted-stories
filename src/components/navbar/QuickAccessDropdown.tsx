import { useNavigate } from "react-router-dom";
import { Grid3X3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { servicePages, toolPages } from "./navData";
import type { User } from "@supabase/supabase-js";

interface QuickAccessDropdownProps {
  user: User | null;
}

const QuickAccessDropdown = ({ user }: QuickAccessDropdownProps) => {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          aria-label="Quick access pages"
        >
          <Grid3X3 size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-normal">
          Services
        </DropdownMenuLabel>
        {servicePages.map((p) => (
          <DropdownMenuItem
            key={p.to}
            onClick={() => navigate(p.to)}
            className="cursor-pointer text-[13px]"
          >
            {p.label}
          </DropdownMenuItem>
        ))}
        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-normal">
              Tools
            </DropdownMenuLabel>
            {toolPages.map((p) => (
              <DropdownMenuItem
                key={p.to}
                onClick={() => navigate(p.to)}
                className="cursor-pointer text-[13px]"
              >
                {p.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickAccessDropdown;
