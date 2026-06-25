"use client";

import { useMemo } from "react";
import { SearchableSelect } from "@/components/SearchableSelect";

export type EquipmentOption = {
  id: string;
  code: string;
  name: string;
  status?: string;
};

type Props = {
  value: string;
  onChange: (equipmentId: string) => void;
  options: EquipmentOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function EquipmentSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn thiết bị...",
  disabled,
  className,
}: Props) {
  const selectOptions = useMemo(
    () =>
      options.map((o) => ({
        value: o.id,
        label: `${o.code} — ${o.name}`,
        searchText: `${o.code} ${o.name} ${o.status ?? ""}`,
      })),
    [options],
  );

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={selectOptions}
      placeholder={placeholder}
      emptyLabel="Không tìm thấy thiết bị"
      disabled={disabled}
      className={className}
    />
  );
}
