import { exportUrl } from "@/lib/api";

export default function ExportButtons({ jobId }: { jobId: string }) {
  return (
    <div className="flex gap-3">
      <a
        href={exportUrl(jobId, "srt")}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Pobierz SRT
      </a>
      <a
        href={exportUrl(jobId, "vtt")}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Pobierz VTT
      </a>
    </div>
  );
}
