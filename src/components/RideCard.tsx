import { useState } from "react";
import { Ride, RideRequest, getDirectionShort, canRejectPassenger, canCancelRequest, getMinutesUntilRide } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Users, Car, Phone, Trash2, ArrowRight, ArrowLeft, UserPlus, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRequests, useDeleteRide, useCreateRequest, useUpdateRequestStatus } from "@/hooks/useRides";

interface RideCardProps {
  ride: Ride;
}

export function RideCard({ ride }: RideCardProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [requestMode, setRequestMode] = useState(false);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerVerified, setOwnerVerified] = useState(false);

  const { data: requests = [] } = useRequests(ride.id);
  const deleteMutation = useDeleteRide();
  const requestMutation = useCreateRequest();
  const statusMutation = useUpdateRequestStatus();

  const isToOffice = ride.direction === "to-office";
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const availableSeats = ride.seats - approvedCount;
  const minutesUntil = getMinutesUntilRide(ride);
  const isPast = minutesUntil < 0;
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const handleDelete = () => {
    if (verifyPhone === ride.phone) {
      deleteMutation.mutate({ id: ride.id, phone: ride.phone }, {
        onSuccess: () => toast.success("Ride deleted"),
        onError: () => toast.error("Failed to delete"),
      });
    } else {
      toast.error("Phone number doesn't match");
    }
  };

  const handleRequest = () => {
    if (!passengerName.trim() || passengerPhone.trim().length < 10) {
      toast.error("Enter valid name and 10-digit phone");
      return;
    }
    if (availableSeats <= 0) {
      toast.error("No seats available");
      return;
    }
    const existing = requests.find((r) => r.passengerPhone === passengerPhone.trim() && r.status !== "cancelled" && r.status !== "rejected");
    if (existing) {
      toast.error("You already have a request for this ride");
      return;
    }
    requestMutation.mutate(
      { rideId: ride.id, passengerName: passengerName.trim(), passengerPhone: passengerPhone.trim() },
      {
        onSuccess: () => {
          toast.success("Ride request sent! The driver will approve/reject.");
          setRequestMode(false);
          setPassengerName("");
          setPassengerPhone("");
        },
      }
    );
  };

  const handleApprove = (req: RideRequest) => {
    statusMutation.mutate({ id: req.id, status: "approved" }, {
      onSuccess: () => toast.success(`${req.passengerName} approved`),
    });
  };

  const handleReject = (req: RideRequest) => {
    if (!canRejectPassenger(ride)) {
      toast.error("Cannot reject within 15 minutes of ride start");
      return;
    }
    statusMutation.mutate({ id: req.id, status: "rejected" }, {
      onSuccess: () => toast.success(`${req.passengerName} rejected`),
    });
  };

  const handleCancel = (req: RideRequest) => {
    if (!canCancelRequest(ride)) {
      toast.error("Cannot cancel within 30 minutes of ride start");
      return;
    }
    statusMutation.mutate({ id: req.id, status: "cancelled" }, {
      onSuccess: () => toast.success("Request cancelled"),
    });
  };

  const handleShowRequests = () => {
    if (ownerPhone !== ride.phone) {
      toast.error("Phone doesn't match — only the driver can manage requests");
      return;
    }
    setOwnerVerified(true);
  };

  return (
    <Card className={`ride-card-shadow hover:ride-card-shadow-hover transition-shadow animate-slide-up ${isPast ? "opacity-60" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">{ride.name}</span>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs">{availableSeats}/{ride.seats} seats</Badge>
            <Badge variant="secondary" className="text-xs">
              {isToOffice ? <ArrowRight className="w-3 h-3 mr-1" /> : <ArrowLeft className="w-3 h-3 mr-1" />}
              {getDirectionShort(ride.direction)}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ride.date} · {ride.time}</span>
          <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{ride.vehicle || "Car"}</span>
        </div>

        {!isPast && minutesUntil < 30 && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <AlertCircle className="w-3.5 h-3.5" />Ride starts in {Math.round(minutesUntil)} min
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {showPhone ? (
            <a href={`tel:${ride.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Phone className="w-3.5 h-3.5" />{ride.phone}
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowPhone(true)} className="text-xs">
              <Phone className="w-3.5 h-3.5 mr-1" /> Contact
            </Button>
          )}
          {!isPast && availableSeats > 0 && (
            <Button variant="default" size="sm" onClick={() => setRequestMode(!requestMode)} className="text-xs">
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Request Seat
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowManage(!showManage)} className="text-xs ml-auto">
            <Users className="w-3.5 h-3.5 mr-1" /> {pendingRequests.length > 0 ? `${pendingRequests.length} pending` : "Manage"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteMode(!deleteMode)} className="text-xs text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Request seat form */}
        {requestMode && (
          <div className="space-y-2 animate-slide-up border-t pt-3">
            <p className="text-xs font-medium text-foreground">Request a seat</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Your name" value={passengerName} onChange={(e) => setPassengerName(e.target.value)} className="text-sm h-8" />
              <Input placeholder="Phone (10 digits)" value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="text-sm h-8" />
            </div>
            <Button size="sm" onClick={handleRequest} disabled={requestMutation.isPending} className="w-full text-xs">
              {requestMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </div>
        )}

        {/* Manage requests — phone verification */}
        {showManage && !ownerVerified && (
          <div className="space-y-2 animate-slide-up border-t pt-3">
            <p className="text-xs text-muted-foreground">Enter your registered phone to manage requests</p>
            <div className="flex gap-2">
              <Input placeholder="Your phone" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="text-sm h-8" />
              <Button size="sm" onClick={handleShowRequests} className="text-xs shrink-0">View</Button>
            </div>
          </div>
        )}

        {/* Requests list (driver view) */}
        {ownerVerified && (
          <div className="space-y-2 animate-slide-up border-t pt-3">
            <p className="text-xs font-medium text-foreground">Ride Requests</p>
            {requests.length === 0 ? (
              <p className="text-xs text-muted-foreground">No requests yet</p>
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-medium text-foreground">{req.passengerName}</span>
                      <span className="text-muted-foreground text-xs">{req.passengerPhone}</span>
                      <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                        {req.status}
                      </Badge>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" onClick={() => handleApprove(req)} className="h-6 w-6 p-0"><Check className="w-3 h-3" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(req)} className="h-6 w-6 p-0"><X className="w-3 h-3" /></Button>
                      </div>
                    )}
                    {req.status === "approved" && (
                      <Button size="sm" variant="ghost" onClick={() => handleCancel(req)} className="text-xs h-6">Cancel</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete */}
        {deleteMode && (
          <div className="flex gap-2 items-center animate-slide-up border-t pt-3">
            <Input placeholder="Enter phone to verify" value={verifyPhone} onChange={(e) => setVerifyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="text-sm h-8" />
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending} className="text-xs shrink-0">
              {deleteMutation.isPending ? "..." : "Delete"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
