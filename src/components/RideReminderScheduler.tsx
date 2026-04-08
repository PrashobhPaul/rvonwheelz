import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRides, useRequests } from "@/hooks/useRides";
import { toast } from "sonner";

/** Set of ride IDs for which a reminder has already fired this session */
const firedReminders = new Set<string>();

function getMs(date: string, time: string): number {
  return new Date(`${date}T${time}`).getTime();
}

export function RideReminderScheduler() {
  const { user } = useAuth();
  const { data: rides = [] } = useRides();
  const { data: requests = [] } = useRequests();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!user) return;

    // Clear previous timers
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const now = Date.now();
    const REMINDER_MS = 5 * 60_000; // 5 minutes before

    // Collect ride IDs relevant to the user
    const myRideIds = new Set<string>();

    // Rides I'm driving
    rides.forEach((r) => {
      if (r.user_id === user.id) myRideIds.add(r.id);
    });

    // Rides I'm an approved passenger on
    requests.forEach((req) => {
      if (req.passenger_id === user.id && req.status === "approved") {
        myRideIds.add(req.ride_id);
      }
    });

    // Schedule reminders
    for (const rideId of myRideIds) {
      if (firedReminders.has(rideId)) continue;

      const ride = rides.find((r) => r.id === rideId);
      if (!ride) continue;

      const rideMs = getMs(ride.date, ride.time);
      const reminderMs = rideMs - REMINDER_MS;
      const delay = reminderMs - now;

      // Only schedule if reminder is in the future and within 24h
      if (delay > 0 && delay < 24 * 60 * 60_000) {
        const t = setTimeout(() => {
          if (firedReminders.has(rideId)) return;
          firedReminders.add(rideId);

          const label = ride.user_id === user.id ? "Your offered ride" : "Your booked ride";
          const msg = `⏰ ${label} to ${ride.destination.split("–")[0].trim()} is starting in 5 minutes!`;

          // In-app toast
          toast.warning(msg, { duration: 15000 });

          // Browser notification if permitted
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Ride Reminder", { body: msg, icon: "/placeholder.svg" });
          }
        }, delay);

        timers.current.push(t);
      }

      // If the ride time has already passed, mark as fired to avoid stale checks
      if (rideMs < now) {
        firedReminders.add(rideId);
      }
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [user, rides, requests]);

  // Request notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return null;
}
