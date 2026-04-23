// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import api from "../utils/api";
import { StitchButton, StitchCard, StitchLoadingPage, StitchSectionHeader, StitchShell } from "../stitch/components/StitchPrimitives";

export default function AddPropertyLocation() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const loadProperty = useCallback(async () => {
    try {
      const response = await api.get(`/property/${propertyId}/public`);
      setProperty(response.data);
      if (response.data?.latitude && response.data?.longitude) {
        setLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
        setStatus("success");
      }
    } catch {
      setError("Property not found or link expired");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported");
      return;
    }

    setStatus("capturing");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setStatus("captured");
        toast.success("Location captured");
      },
      (geoError) => {
        setStatus("error");
        if (geoError.code === 1) toast.error("Allow location access");
        else if (geoError.code === 2) toast.error("Location unavailable");
        else toast.error("Location timed out");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const saveLocation = async () => {
    if (!location.latitude || !location.longitude) {
      toast.error("Capture location first");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/property/${propertyId}/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setStatus("success");
      toast.success("Location saved");
    } catch {
      toast.error("Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <StitchLoadingPage label="Loading property" />;
  }

  if (error) {
    return (
      <StitchShell title="Location" compact>
        <div className="mx-auto w-full max-w-2xl">
          <StitchCard className="p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
            <p className="mt-4 text-sm text-[var(--stitch-muted)]">{error}</p>
          </StitchCard>
        </div>
      </StitchShell>
    );
  }

  return (
    <StitchShell
      title="Add Location"
      eyebrow="Property GPS"
      actions={
        <button onClick={() => navigate(-1)} className="stitch-button stitch-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <div className="mx-auto grid w-full max-w-4xl gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <StitchCard className="p-6">
          <StitchSectionHeader title="Property" />
          {property ? (
            <div className="mt-6 space-y-3">
              <p className="text-xl font-black uppercase tracking-[-0.04em]">{property.title}</p>
              <p className="text-sm leading-7 text-[var(--stitch-muted)]">{property.exact_address}</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                {property.area_name}, {property.city}
              </p>
            </div>
          ) : null}
        </StitchCard>

        <StitchCard className="p-6 md:p-8">
          <StitchSectionHeader title={status === "success" ? "Saved" : "Capture location"} />
          {status === "success" ? (
            <div className="mt-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <p className="mt-4 text-lg font-black uppercase tracking-[0.08em]">Location saved</p>
              <p className="mt-3 text-sm text-[var(--stitch-muted)]">
                {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-[26px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-5 text-sm leading-7 text-[var(--stitch-muted)]">
                Go to the exact property spot, capture GPS, then save it.
              </div>
              <StitchButton onClick={captureLocation} disabled={status === "capturing"} className="w-full justify-center">
                {status === "capturing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {status === "capturing" ? "Capturing" : "Capture my location"}
              </StitchButton>

              {location.latitude && location.longitude && status === "captured" ? (
                <div className="rounded-[26px] border border-[var(--stitch-line)] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Captured coordinates</p>
                  <p className="mt-3 text-sm text-[var(--stitch-muted)]">Latitude: {location.latitude.toFixed(6)}</p>
                  <p className="text-sm text-[var(--stitch-muted)]">Longitude: {location.longitude.toFixed(6)}</p>
                  <StitchButton onClick={saveLocation} disabled={saving} className="mt-5 w-full justify-center">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {saving ? "Saving" : "Save location"}
                  </StitchButton>
                </div>
              ) : null}
            </div>
          )}
        </StitchCard>
      </div>
    </StitchShell>
  );
}
