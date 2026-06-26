"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  EQUIPMENT_LABEL_PRINT_ROWS,
  LABEL_LAYOUT_PROFILES,
  profileToStyleVars,
  type EquipmentLabelData,
  type LabelLayoutProfile,
} from "@/lib/equipment-label-print";
import { cn } from "@/lib/utils";
import "./equipment-label-print.css";

type Props = {
  data: EquipmentLabelData;
  className?: string;
  onProfileResolved?: (profile: LabelLayoutProfile) => void;
};

export function EquipmentLabelPrint({ data, className, onProfileResolved }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [profileIndex, setProfileIndex] = useState(0);

  const profile = LABEL_LAYOUT_PROFILES[profileIndex] ?? LABEL_LAYOUT_PROFILES.at(-1)!;

  useLayoutEffect(() => {
    setProfileIndex(0);
  }, [data]);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (
      profileIndex < LABEL_LAYOUT_PROFILES.length - 1 &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      setProfileIndex(profileIndex + 1);
      return;
    }
    onProfileResolved?.(profile);
  }, [data, profile, profileIndex, onProfileResolved]);

  return (
    <div
      ref={cardRef}
      className={cn("label-card", className)}
      style={profileToStyleVars(profile)}
    >
      <img
        src="/sci-tech-logo.png"
        alt=""
        aria-hidden
        className="label-watermark"
      />
      <div className="label-content">
        <div className="label-title">CÔNG TY SCI-TECH</div>
        {EQUIPMENT_LABEL_PRINT_ROWS.map(({ key, label }) => (
          <div key={key} className="label-row">
            <strong>{label}:</strong> {data[key]}
          </div>
        ))}
      </div>
    </div>
  );
}
