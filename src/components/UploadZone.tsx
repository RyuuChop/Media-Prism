import { useRef, useState } from "react";
import { FolderOpen, ImageIcon, Music, UploadCloud } from "lucide-react";
import { cn } from "../utils/cn";

const FORMAT_CHIPS = [
  // Audio
  "MP3",
  "WAV",
  "AAC",
  "OGG",
  "M4A",
  "FLAC",
  // Image
  "PNG",
  "JPG",
  "JPEG",
  "JPE",
  "WEBP",
  "ICO",
  "GIF",
  "BMP",
  "SVG",
  "TIFF",
];

export default function UploadZone({
  onFiles,
  onDemoAudio,
  onDemoImage,
  demoAudioLoading,
  demoImageLoading,
}: {
  onFiles: (files: File[]) => void;
  onDemoAudio: () => void;
  onDemoImage: () => void;
  demoAudioLoading: boolean;
  demoImageLoading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      onClick={openPicker}
      onDragEnter={(e) => {
        e.preventDefault();
        counter.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        counter.current -= 1;
        if (counter.current <= 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        counter.current = 0;
        setDragging(false);
        if (e.dataTransfer.files?.length) onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-[28px] border-2 border-dashed transition-all duration-300",
        dragging
          ? "scale-[1.01] border-indigo-400/70 bg-indigo-500/10 shadow-[0_0_90px_-12px_rgba(99,102,241,0.6)]"
          : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.045]",
      )}
    >
      <div className="pointer-events-none absolute -inset-x-20 -top-40 h-64 rotate-[-8deg] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-col items-center px-6 py-12 text-center sm:py-14">
        <div
          className={cn(
            "relative mb-5 transition-transform duration-300",
            dragging && "scale-110",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-3xl blur-2xl transition-colors duration-300",
              dragging ? "bg-indigo-500/50" : "bg-indigo-500/20",
            )}
          />
          <div className="relative flex h-18 w-18 items-center justify-center rounded-3xl border border-white/15 bg-gradient-to-br from-indigo-500/90 via-violet-500/90 to-fuchsia-500/90 shadow-xl shadow-indigo-950/50">
            <UploadCloud className="h-8 w-8 text-white" strokeWidth={1.8} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white sm:text-2xl">
          {dragging ? "Release to convert media" : "Drop image or audio files here"}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-slate-400">
          or click to browse — PNG, JPG, JPEG, JPE, WEBP, ICO, GIF, BMP, SVG, TIFF, MP3, WAV, AAC, OGG, M4A, FLAC.{" "}
          <span className="text-slate-500">100% in-browser · Zero lag · Instant output.</span>
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 transition-all duration-200 hover:shadow-indigo-500/30 hover:brightness-110 active:scale-95"
          >
            <FolderOpen className="h-4 w-4" />
            Browse files
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDemoImage();
            }}
            disabled={demoImageLoading || demoAudioLoading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className={cn("h-4 w-4 text-cyan-400", demoImageLoading && "animate-spin")} />
            {demoImageLoading ? "Generating Graphic…" : "Sample Graphic (PNG)"}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDemoAudio();
            }}
            disabled={demoAudioLoading || demoImageLoading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
          >
            <Music
              className={cn("h-4 w-4 text-fuchsia-400", demoAudioLoading && "animate-spin")}
            />
            {demoAudioLoading ? "Synthesizing Track…" : "Sample Audio (WAV)"}
          </button>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5 max-w-2xl">
          {FORMAT_CHIPS.map((f) => (
            <span
              key={f}
              className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-slate-400"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="audio/*,image/*,.mp3,.wav,.aac,.ogg,.oga,.m4a,.flac,.opus,.weba,.png,.jpg,.jpeg,.jpe,.webp,.ico,.gif,.bmp,.svg,.tiff,.tif,.avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}
