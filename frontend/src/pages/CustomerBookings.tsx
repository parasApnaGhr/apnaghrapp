// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin, Navigation, Phone, Route, User } from "lucide-react";
import { toast } from "sonner";
import { visitAPI } from "../utils/api";
import {
  StitchButton,
  StitchCard,
  StitchLoadingPage,
  StitchModal,
  StitchSectionHeader,
  StitchShell,
} from "../stitch/components/StitchPrimitives";

const activeStatuses = new Set(["pending", "rider_assigned", "pickup_started", "at_customer", "navigating", "at_property"]);

const getStatusMeta = (status: string) => {
  const map: Record<string, { title: string; copy: string }> = {
    pending: { title: "Finding rider", copy: "The system is matching your booking with an available rider." },
    rider_assigned: { title: "Rider assigned", copy: "A rider has accepted the booking and is preparing for pickup." },
    pickup_started: { title: "On the way", copy: "Your rider is moving toward the pickup point." },
    at_customer: { title: "At pickup", copy: "The rider has reached your pickup point and is waiting." },
    navigating: { title: "Tour started", copy: "Your booking is actively moving through the property route." },
    at_property: { title: "At property", copy: "The current stop is being visited right now." },
    completed: { title: "Completed", copy: "This booking finished successfully." },
    cancelled: { title: "Cancelled", copy: "This booking is no longer active." },
  };

  return map[status] || { title: status, copy: "Status update available." };
};

export default function CustomerBookings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const loadBookings = async () => {
    try {
      const response = await visitAPI.getMyBookings();
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeBookings = useMemo(() => bookings.filter((booking) => activeStatuses.has(booking.status)), [bookings]);
  const completedBookings = useMemo(() => bookings.filter((booking) => !activeStatuses.has(booking.status)), [bookings]);
  const displayed = activeTab === "active" ? activeBookings : completedBookings;

  const openTracking = async (booking: any) => {
    setTrackingModalOpen(true);
    setTrackingBooking(booking);
    setTrackingLoading(true);
    try {
      const response = await visitAPI.trackVisit(booking.id);
      setTrackingData(response.data);
    } catch {
      toast.error("Unable to fetch live tracking.");
      setTrackingData(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) {
    return <StitchLoadingPage label="Loading active bookings and refreshing visit status." />;
  }

  return (
    <>
      <StitchShell
        title="Operations"
        eyebrow="Logistics"
        actions={
          <button onClick={() => navigate("/customer")} className="stitch-button stitch-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to discovery
          </button>
        }
      >
        <div className="flex flex-col gap-10">
          <div className="space-y-4">
            <h1 className="font-headline text-5xl font-black uppercase tracking-[-0.04em] text-black md:text-7xl">Your Bookings</h1>
            <p className="max-w-2xl text-lg font-bold text-[var(--stitch-muted)]">Manage your property tours and track active rides in real-time.</p>
          </div>

          <div className="flex w-full max-w-md border-b border-[var(--stitch-line)]">
            <button 
              onClick={() => setActiveTab("active")}
              className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "active" ? "border-b-2 border-black text-black" : "text-[var(--stitch-muted)]"}`}
            >
              Active ({activeBookings.length})
            </button>
            <button 
              onClick={() => setActiveTab("completed")}
              className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "completed" ? "border-b-2 border-black text-black" : "text-[var(--stitch-muted)]"}`}
            >
              Completed ({completedBookings.length})
            </button>
          </div>

          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-[var(--stitch-line-strong)] bg-white p-20 text-center">
              <Calendar className="h-12 w-12 text-[var(--stitch-muted)]" />
              <h2 className="mt-6 text-xl font-black uppercase tracking-widest text-[var(--stitch-muted)]">
                {activeTab === "active" ? "No active deployments" : "No history found"}
              </h2>
            </div>
          ) : (
            <div className="grid gap-12">
              {displayed.map((booking) => {
                const statusMeta = getStatusMeta(booking.status);
                const completedStops = booking.properties_completed?.length || 0;
                const totalStops = booking.property_ids?.length || booking.properties?.length || 1;
                
                return (
                  <div key={booking.id} className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Status & Map */}
                    <div className="lg:col-span-7">
                      <div className="bg-white p-8 md:p-12 border border-[var(--stitch-line)] flex flex-col gap-8 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--stitch-muted)]">Tour #{booking.id?.slice(0, 6)}</span>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-black">
                              {booking.properties?.[0]?.title || "Property Tour"}
                            </h2>
                          </div>
                          <div className="flex items-center gap-2 bg-[var(--stitch-soft)] px-4 py-2">
                            <div className="h-2 w-2 rounded-full bg-black animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">{booking.status.replaceAll("_", " ")}</span>
                          </div>
                        </div>

                        {/* Tracker Placeholder */}
                        <div className="relative h-72 w-full overflow-hidden bg-[var(--stitch-soft)]">
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 grayscale opacity-40">
                            <Navigation className="h-12 w-12 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest">Live Asset Tracking Active</p>
                          </div>
                          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                            <div className="bg-white p-4 shadow-xl">
                              <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--stitch-muted)] mb-1">ETA</span>
                              <span className="text-2xl font-black text-black">14 MIN</span>
                            </div>
                            <StitchButton onClick={() => openTracking(booking)} className="shadow-xl">
                              <Navigation className="h-4 w-4" />
                              Tracker
                            </StitchButton>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-6">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--stitch-muted)]">
                            <span className={booking.status === "pending" ? "text-black" : ""}>Matching</span>
                            <span className={booking.status === "navigating" ? "text-black" : ""}>En Route</span>
                            <span className={booking.status === "at_property" ? "text-black" : ""}>On Site</span>
                          </div>
                          <div className="relative h-1 w-full bg-[var(--stitch-soft)]">
                            <div 
                              className="absolute h-full bg-black transition-all duration-1000" 
                              style={{ width: booking.status === "completed" ? "100%" : booking.status === "navigating" ? "66%" : "33%" }}
                            />
                          </div>
                        </div>

                        {/* Rider Info */}
                        {booking.rider_id ? (
                          <div className="flex items-center justify-between border-t border-[var(--stitch-line)] pt-8">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 overflow-hidden bg-[var(--stitch-soft)]">
                                <img src={`https://ui-avatars.com/api/?name=${booking.rider_name || "R"}&background=000&color=fff`} className="h-full w-full grayscale" />
                              </div>
                              <div>
                                <p className="text-base font-black uppercase tracking-tight">{booking.rider_name || "ApnaGhr Rider"}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--stitch-muted)]">Verified Partner</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {booking.rider_phone && (
                                <a href={`tel:${booking.rider_phone}`} className="flex h-12 w-12 items-center justify-center border border-black hover:bg-black hover:text-white transition-colors">
                                  <Phone className="h-5 w-5" />
                                </a>
                              )}
                              <button className="flex h-12 w-12 items-center justify-center bg-black text-white hover:bg-black/90 transition-colors">
                                <Route className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-t border-[var(--stitch-line)] pt-8 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--stitch-muted)]">Assigning professional rider...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Itinerary */}
                    <div className="lg:col-span-5">
                      <div className="h-full border-l-4 border-black bg-white p-8 md:p-12">
                        <h3 className="text-xl font-black uppercase tracking-tight text-black mb-10">Tour Itinerary</h3>
                        <div className="relative space-y-12 pl-8 before:absolute before:left-0 before:top-2 before:h-[calc(100%-24px)] before:w-px before:bg-[var(--stitch-line-strong)]">
                          {booking.properties?.map((property, idx) => {
                            const isDone = booking.properties_completed?.includes(property.id);
                            return (
                              <div key={property.id} className="relative">
                                <div className={`absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${isDone ? "bg-black border-black text-white" : "bg-white border-black text-black"}`}>
                                  {isDone ? <CheckCircle className="h-3 w-3" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                                </div>
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDone ? "text-[var(--stitch-muted)]" : "text-black"}`}>
                                      {idx === 0 ? "10:00 AM" : idx === 1 ? "11:30 AM" : "01:00 PM"}
                                    </span>
                                    <h4 className={`text-lg font-black uppercase tracking-tight ${isDone ? "text-[var(--stitch-muted)] line-through" : "text-black"}`}>
                                      {property.title}
                                    </h4>
                                    <p className="text-sm text-[var(--stitch-muted)]">{property.location || property.area_name}</p>
                                  </div>
                                  {!isDone && property.image && (
                                    <div className="h-32 w-full overflow-hidden bg-[var(--stitch-soft)]">
                                      <img src={property.image} className="h-full w-full object-cover grayscale opacity-80" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </StitchShell>

      <StitchModal open={trackingModalOpen}>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="stitch-eyebrow">Live tracking</p>
              <p className="text-2xl font-black uppercase tracking-[-0.05em]">{trackingBooking?.rider_name || "Assigned rider"}</p>
            </div>
            <button onClick={() => setTrackingModalOpen(false)} className="stitch-button stitch-button-secondary">
              Close
            </button>
          </div>

          {trackingLoading ? (
            <div className="rounded-[28px] border border-[var(--stitch-line)] p-12 text-center">
              <Clock className="mx-auto h-8 w-8 animate-pulse text-[var(--stitch-muted)]" />
              <p className="mt-4 text-sm text-[var(--stitch-muted)]">Refreshing rider position and ETA.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] bg-black p-6 text-white">
                <p className="stitch-eyebrow !text-white/60">ETA</p>
                <p className="mt-3 text-5xl font-black tracking-[-0.07em]">{Math.round(trackingData?.eta?.eta_minutes || 0)}</p>
                <p className="mt-2 text-sm text-white/70">minutes</p>
                <div className="mt-5 flex items-center gap-2 text-sm text-white/70">
                  <Route className="h-4 w-4" />
                  {trackingData?.eta?.distance_km || 0} km away
                </div>
              </div>
              <div className="rounded-[28px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-6">
                <p className="stitch-eyebrow">Current state</p>
                <p className="mt-3 text-2xl font-black uppercase tracking-[-0.04em]">
                  {trackingData?.visit?.current_step?.replaceAll("_", " ") || trackingBooking?.status}
                </p>
                <p className="mt-2 text-sm text-[var(--stitch-muted)]">
                  {trackingData?.rider?.current_lat && trackingData?.rider?.current_lng
                    ? `${trackingData.rider.current_lat.toFixed(4)}, ${trackingData.rider.current_lng.toFixed(4)}`
                    : "Coordinates not available right now."}
                </p>
                {trackingData?.rider?.current_lat && trackingData?.rider?.current_lng ? (
                  <div className="mt-5">
                    <StitchButton
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps?q=${trackingData.rider.current_lat},${trackingData.rider.current_lng}`,
                          "_blank"
                        )
                      }
                      className="w-full"
                    >
                      <Navigation className="h-4 w-4" />
                      Open in Google Maps
                    </StitchButton>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </StitchModal>
    </>
  );
}
