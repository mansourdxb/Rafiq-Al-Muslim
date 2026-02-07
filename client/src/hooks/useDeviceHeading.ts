import { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { Accelerometer, Magnetometer } from "expo-sensors";

type HeadingSource = "location" | "sensors";

type DeviceHeading = {
  headingDeg: number | null;
  accuracy: number | null;
  source: HeadingSource;
};

const SMOOTHING = 0.85;

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function normalizeDeg(deg: number) {
  return (deg + 360) % 360;
}

function computeTiltCompensatedHeading(
  mag: { x: number; y: number; z: number },
  acc: { x: number; y: number; z: number }
) {
  const ax = acc.x;
  const ay = acc.y;
  const az = acc.z;

  const roll = Math.atan2(ay, az);
  const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));

  const mx = mag.x;
  const my = mag.y;
  const mz = mag.z;

  const Xh = mx * Math.cos(pitch) + mz * Math.sin(pitch);
  const Yh =
    mx * Math.sin(roll) * Math.sin(pitch) +
    my * Math.cos(roll) -
    mz * Math.sin(roll) * Math.cos(pitch);

  const headingRad = Math.atan2(Yh, Xh);
  return normalizeDeg(toDeg(headingRad));
}

export function useDeviceHeading(): DeviceHeading {
  const [headingDeg, setHeadingDeg] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [source, setSource] = useState<HeadingSource>("location");

  const lastHeadingRef = useRef<number | null>(null);
  const lastHeadingTimeRef = useRef<number>(0);
  const magRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const accRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const fallbackEnabledRef = useRef(false);

  const applySmooth = (next: number) => {
    const prev = lastHeadingRef.current;
    const smoothed = prev == null ? next : prev * SMOOTHING + next * (1 - SMOOTHING);
    lastHeadingRef.current = smoothed;
    setHeadingDeg(smoothed);
  };

  const evaluateStability = (next: number) => {
    const now = Date.now();
    const prev = lastHeadingRef.current;
    if (prev == null) {
      lastHeadingTimeRef.current = now;
      return;
    }
    const delta = Math.abs(next - prev);
    if (now - lastHeadingTimeRef.current > 3000 && delta < 15) {
      fallbackEnabledRef.current = true;
    }
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      setHeadingDeg(null);
      setAccuracy(null);
      setSource("location");
      return;
    }

    let locationSub: Location.LocationSubscription | null = null;
    let magSub: any = null;
    let accSub: any = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) {
        fallbackEnabledRef.current = true;
        setSource("sensors");
        return;
      }

      locationSub = await Location.watchHeadingAsync((heading) => {
        const raw =
          heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
        if (!Number.isFinite(raw)) return;
        setAccuracy(heading.accuracy ?? null);
        if (heading.accuracy != null && heading.accuracy > 25) {
          fallbackEnabledRef.current = true;
          setSource("sensors");
          return;
        }
        setSource("location");
        const normalized = normalizeDeg(raw);
        evaluateStability(normalized);
        applySmooth(normalized);
      });
    })();

    // Sensor fallback (magnetometer + accelerometer)
    Magnetometer.setUpdateInterval(200);
    Accelerometer.setUpdateInterval(200);

    magSub = Magnetometer.addListener((data) => {
      magRef.current = data;
      if (!fallbackEnabledRef.current) return;
      const acc = accRef.current;
      if (!acc) return;
      const heading = computeTiltCompensatedHeading(data, acc);
      setSource("sensors");
      applySmooth(heading);
    });

    accSub = Accelerometer.addListener((data) => {
      accRef.current = data;
      if (!fallbackEnabledRef.current) return;
      const mag = magRef.current;
      if (!mag) return;
      const heading = computeTiltCompensatedHeading(mag, data);
      setSource("sensors");
      applySmooth(heading);
    });

    return () => {
      cancelled = true;
      if (locationSub) locationSub.remove();
      if (magSub) magSub.remove();
      if (accSub) accSub.remove();
    };
  }, []);

  return useMemo(
    () => ({ headingDeg, accuracy, source }),
    [headingDeg, accuracy, source]
  );
}
