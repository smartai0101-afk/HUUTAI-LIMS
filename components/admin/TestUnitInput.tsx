"use client";

const defaultClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm w-full";

type Props = {
  suggestions: string[];
  listId?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
};

export function TestUnitInput({
  suggestions,
  listId = "test-unit-suggestions",
  name,
  value,
  defaultValue,
  onChange,
  className = defaultClass,
  placeholder = "ĐVT (chọn hoặc gõ…)",
}: Props) {
  const isControlled = value !== undefined;

  return (
    <>
      <input
        name={name}
        list={listId}
        value={isControlled ? value : undefined}
        defaultValue={!isControlled ? defaultValue : undefined}
        placeholder={placeholder}
        className={className}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
      <datalist id={listId}>
        {suggestions.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
    </>
  );
}
