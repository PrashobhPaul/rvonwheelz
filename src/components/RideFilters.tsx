import { useState, useEffect } from "react";
import { Car, Bike, CalendarDays, CalendarPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getLocalToday, getLocalTomorrow } from "@/lib/types";

export type DateFilter = "today" | "tomorrow" | string;
export type VehicleFilter = "any" | "car" | "bike";

const STORAGE_KEY = "rvonwheelz_filters";

function loadPersistedFilters(): { destination?: string; vehicleType?: VehicleFilter } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function persistFilters(destination: string, vehicleType: VehicleFilter) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ destination, vehicleType }));
  } catch {}
}

interface RideFiltersProps {
  dateFilter: DateFilter;
  onDateChange: (d: DateFilter) => void;
  vehicleFilter: VehicleFilter;
  onVehicleChange: (v: VehicleFilter) => void;
}

export function usePersistedFilters(profileDestination?: string) {
  const persisted = loadPersistedFilters();
  return {
    initialDestination: profileDestination || persisted.destination || "all",
    initialVehicle: persisted.vehicleType || ("any" as VehicleFilter),
    persist: persistFilters,
  };
}

export function getDateValue(filter: DateFilter): string {
  if (filter === "today") return getLocalToday();
  if (filter === "tomorrow") return getLocalTomorrow();
  return filter;
}

export function RideFilters({ dateFilter, onDateChange, vehicleFilter, onVehicleChange }: RideFiltersProps) {
  const [showCustomDate, setShowCustomDate] = useState(false);

  const isCustom = dateFilter !== "today" && dateFilter !== "tomorrow";

  return (
    <div className="space-y-2">
      {/* Date filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Date</label>
        <div className="flex gap-1.5">
          <button
            onClick={() => { setShowCustomDate(false); onDateChange("today"); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              dateFilter === "today"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Today
          </button>
          <button
            onClick={() => { setShowCustomDate(false); onDateChange("tomorrow"); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              dateFilter === "tomorrow"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Tomorrow
          </button>
          <button
            onClick={() => setShowCustomDate(!showCustomDate)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isCustom
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            {isCustom ? new Date(dateFilter + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Pick Date"}
          </button>
        </div>
        {showCustomDate && (
          <Input
            type="date"
            min={getLocalToday()}
            value={isCustom ? dateFilter : ""}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(e.target.value);
              }
            }}
            className="text-sm mt-1 w-44"
          />
        )}
      </div>

      {/* Vehicle type filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Vehicle Type</label>
        <div className="flex gap-1.5">
          {([
            { value: "any" as const, label: "Any", icon: null },
            { value: "car" as const, label: "Car", icon: Car },
            { value: "bike" as const, label: "Bike", icon: Bike },
          ]).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onVehicleChange(value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                vehicleFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
