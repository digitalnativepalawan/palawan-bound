import { ShieldCheck } from "lucide-react";
import type { Destination } from "@/pages/Index";

interface AdminPanelProps {
  destination: Destination;
  onUpdateDestination: (
    id: string,
    field: keyof Pick<Destination, "name" | "image_url" | "map_hint">,
    value: string,
  ) => void;
  onClose: () => void;
}

const AdminPanel = ({ onClose }: AdminPanelProps) => (
  <div className="fixed top-[72px] left-1/2 z-40 -translate-x-1/2 pointer-events-none">
    <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 shadow-lg text-white text-xs font-bold animate-soft-rise">
      <ShieldCheck className="h-3.5 w-3.5" />
      Admin — tap cards to edit
      <button
        onClick={onClose}
        className="ml-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold active:scale-90 transition"
      >
        Exit
      </button>
    </div>
  </div>
);

export default AdminPanel;
