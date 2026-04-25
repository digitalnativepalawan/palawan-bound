import { ShieldCheck } from "lucide-react";
import type { Destination } from "@/pages/Index";

/**
 * AdminPanel — lightweight floating indicator that admin mode is active.
 * Heavy editing is handled inline on TripHero + TravelCard.
 * This keeps the UI uncluttered for normal users.
 */
interface AdminPanelProps {
  destination: Destination;
  onUpdateDestination: (
    id: string,
    field: keyof Pick<Destination, "name" | "image_url" | "map_hint">,
    value: string,
  ) => void;
  onClose: () => void;
}

const AdminPanel = ({ onClose }: AdminPanelProps) => {
  return (
    <div className="fixed top-20 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2.5 rounded-full bg-coral/90 backdrop-blur px-4 py-2.5 shadow-lift text-white text-xs font-bold animate-soft-rise">
        <ShieldCheck className="h-3.5 w-3.5" />
        Admin mode — tap cards to edit
        <button
          onClick={onClose}
          className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold active:scale-90 transition"
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
