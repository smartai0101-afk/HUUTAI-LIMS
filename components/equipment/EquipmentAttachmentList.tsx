import { Download } from "lucide-react";

type Attachment = {
  path: string;
  name?: string;
};

export function EquipmentAttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (!attachments.length) {
    return <p className="text-sm text-slate-400">Không có tệp đính kèm</p>;
  }

  return (
    <ul className="space-y-2">
      {attachments.map((file) => (
        <li key={file.path}>
          <a
            href={file.path}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            {file.name ?? file.path.split("/").pop() ?? "Tải xuống"}
          </a>
        </li>
      ))}
    </ul>
  );
}
