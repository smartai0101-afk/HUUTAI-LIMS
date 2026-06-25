"use client";

type Props = {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (file: File | null) => void;
  onMultipleChange?: (files: File[]) => void;
  selectedFileNames?: string[];
  currentPath?: string;
  currentName?: string;
};

export function EquipmentFileUpload({
  label = "Tệp đính kèm",
  accept = ".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png",
  multiple = false,
  onChange,
  onMultipleChange,
  selectedFileNames = [],
  currentPath,
  currentName,
}: Props) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-600">{label}</label>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (multiple) {
            onMultipleChange?.(files);
          } else {
            onChange?.(files[0] ?? null);
          }
          e.target.value = "";
        }}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {multiple && selectedFileNames.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {selectedFileNames.map((name) => (
            <li key={name} className="text-xs text-slate-500">
              {name}
            </li>
          ))}
        </ul>
      ) : null}
      {currentPath && !currentName ? (
        <p className="mt-1 text-xs text-slate-500">
          File hiện tại:{" "}
          <a href={currentPath} target="_blank" rel="noreferrer" className="text-cyan-700 underline">
            Tải xuống
          </a>
        </p>
      ) : null}
      {currentPath && currentName ? (
        <p className="mt-1 text-xs text-slate-500">
          File hiện tại:{" "}
          <a href={currentPath} target="_blank" rel="noreferrer" className="text-cyan-700 underline">
            {currentName}
          </a>
        </p>
      ) : null}
    </div>
  );
}
