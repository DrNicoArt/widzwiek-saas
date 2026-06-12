export type OrchestrationStrategy =
  | "automatic"
  | "cheapest"
  | "fastest"
  | "most_accurate"
  | "institutional"
  | "manual_advanced";

export type ProviderKind =
  | "transcript_source"
  | "transcription"
  | "diarization"
  | "sound_events"
  | "alignment"
  | "text_cleanup"
  | "translation"
  | "export"
  | "billing";

export type ProviderStatus =
  | "active_sample"
  | "available"
  | "api_ready"
  | "missing_key"
  | "placeholder"
  | "planned"
  | "disabled"
  | "failed"
  | "fallback_used";

export type ProviderCapability =
  | "captions_import"
  | "url_audio_extract"
  | "batch_asr"
  | "streaming_asr"
  | "word_timestamps"
  | "speaker_diarization"
  | "sound_events"
  | "forced_alignment"
  | "translation"
  | "text_cleanup"
  | "wcag_validation"
  | "srt_export"
  | "vtt_export"
  | "pdf_report";

export interface ProviderCostProfile {
  tier: "free" | "low" | "metered" | "premium" | "manual";
  note: string;
}

export interface ProviderQualityProfile {
  quality: "sample" | "basic" | "standard" | "high" | "human_review";
  latency: "instant" | "fast" | "standard" | "slow";
  reliability: "sample" | "experimental" | "stable" | "enterprise";
}

export interface ProviderCapabilityProfile {
  id: string;
  kind: ProviderKind;
  name: string;
  userLabel: string;
  status: ProviderStatus;
  cost: ProviderCostProfile;
  quality: ProviderQualityProfile;
  capabilities: ProviderCapability[];
  note: string;
}

export interface ProcessingPolicy {
  strategy: OrchestrationStrategy;
  preferExistingCaptions: boolean;
  requireSoundDescriptions: boolean;
  soundSensitivity: "low" | "standard" | "high";
  addOnlyRelevantSounds: boolean;
  proposeSoundsBeforeExport: boolean;
}

export interface ProcessingDecision {
  strategy: OrchestrationStrategy;
  transcriptSource: string;
  transcriptionProvider: string;
  diarizationProvider: string;
  soundEventProvider: string;
  alignmentProvider: string;
  textCleanupProvider: string;
  exportProvider: string;
  estimatedCredits: number;
  path: string[];
  reason: string;
}

export interface ProcessingFallback {
  fromProvider: string;
  toProvider: string;
  reason: string;
}

export interface ProcessingAuditLog {
  id: string;
  at: string;
  decision: ProcessingDecision;
  fallbacks: ProcessingFallback[];
  providerStatuses: Record<string, ProviderStatus>;
}

export const STRATEGIES: {
  id: OrchestrationStrategy;
  label: string;
  short: string;
  description: string;
  priorities: string[];
}[] = [
  {
    id: "automatic",
    label: "Automatyczna",
    short: "Najlepszy balans",
    description: "System sam dobiera ścieżkę na podstawie źródła, kosztu, jakości, szybkości i statusu providerów.",
    priorities: ["istniejące napisy", "jakość", "koszt", "szybkość", "WCAG"],
  },
  {
    id: "cheapest",
    label: "Najtańsza",
    short: "Minimalizacja kosztu",
    description: "Najpierw gotowe napisy, import transkryptu i tanie źródła; płatne API dopiero jako fallback.",
    priorities: ["captions import", "SRT/VTT/TXT", "tanie API", "krótszy postprocess"],
  },
  {
    id: "fastest",
    label: "Najszybsza",
    short: "Najniższa latencja",
    description: "Preferuje gotowe caption tracks i szybkie providery cloud, z minimalnym postprocessem.",
    priorities: ["gotowe napisy", "niska latencja", "szybki eksport", "krótka kolejka"],
  },
  {
    id: "most_accurate",
    label: "Najdokładniejsza",
    short: "Jakość ponad koszt",
    description: "Preferuje lepszy ASR, dokładniejsze timestampy, diarizację, sound events i pełniejszą walidację.",
    priorities: ["wysoka jakość ASR", "word timestamps", "diaryzacja", "sound events", "walidacja"],
  },
  {
    id: "institutional",
    label: "Instytucjonalna",
    short: "Stabilność i audyt",
    description: "Dla uczelni, instytucji i B2B: raportowalność, historia, eksporty i bezpieczne przepływy.",
    priorities: ["stabilność", "raport WCAG", "historia decyzji", "eksporty", "rozliczenia"],
  },
  {
    id: "manual_advanced",
    label: "Ręczna zaawansowana",
    short: "Tylko dev/admin",
    description: "Pozwala wymusić konkretnego providera, ale nie jest podstawowym trybem pracy użytkownika.",
    priorities: ["debug", "wymuszony provider", "test adaptera", "audyt techniczny"],
  },
];

export const DEFAULT_POLICY: ProcessingPolicy = {
  strategy: "automatic",
  preferExistingCaptions: true,
  requireSoundDescriptions: true,
  soundSensitivity: "standard",
  addOnlyRelevantSounds: true,
  proposeSoundsBeforeExport: true,
};

export const TRANSCRIPT_SOURCE_PROVIDERS: ProviderCapabilityProfile[] = [
  {
    id: "platform-captions",
    kind: "transcript_source",
    name: "Platform captions import",
    userLabel: "Gotowe napisy z platformy",
    status: "planned",
    cost: { tier: "free", note: "najniższy koszt, gdy platforma udostępnia napisy" },
    quality: { quality: "standard", latency: "fast", reliability: "experimental" },
    capabilities: ["captions_import"],
    note: "YouTube/TikTok/Vimeo captions lub auto captions, jeśli są legalnie i technicznie dostępne.",
  },
  {
    id: "srt-vtt-upload",
    kind: "transcript_source",
    name: "SRT/VTT upload",
    userLabel: "Import SRT / VTT",
    status: "active_sample",
    cost: { tier: "free", note: "użytkownik dostarcza napisy" },
    quality: { quality: "standard", latency: "instant", reliability: "stable" },
    capabilities: ["captions_import", "forced_alignment"],
    note: "Import działa; edytor i WCAG normalizują plik do CaptionDocument.",
  },
  {
    id: "txt-csv-json-import",
    kind: "transcript_source",
    name: "TXT/CSV/JSON transcript import",
    userLabel: "Import transkryptu tekstowego",
    status: "placeholder",
    cost: { tier: "free", note: "niski koszt, wymaga alignowania" },
    quality: { quality: "basic", latency: "fast", reliability: "experimental" },
    capabilities: ["captions_import", "forced_alignment"],
    note: "Placeholder pod import TXT/CSV/JSON i ręcznie wklejony transkrypt.",
  },
  {
    id: "meeting-transcript-import",
    kind: "transcript_source",
    name: "Meeting transcript import",
    userLabel: "Transkrypty Zoom / Teams / Meet / Loom",
    status: "planned",
    cost: { tier: "free", note: "użytkownik dostarcza gotowy transcript" },
    quality: { quality: "standard", latency: "fast", reliability: "experimental" },
    capabilities: ["captions_import", "forced_alignment"],
    note: "Import transkryptów ze spotkań i narzędzi wideo.",
  },
  {
    id: "url-resolver",
    kind: "transcript_source",
    name: "URL resolver",
    userLabel: "Link do materiału",
    status: "placeholder",
    cost: { tier: "low", note: "najpierw sprawdza napisy, potem audio" },
    quality: { quality: "standard", latency: "standard", reliability: "experimental" },
    capabilities: ["captions_import", "url_audio_extract"],
    note: "Placeholder; nie wykonuje scrapingu ani zapytań na żywo.",
  },
  {
    id: "sample-transcript",
    kind: "transcript_source",
    name: "Przykładowy transkrypt",
    userLabel: "Materiał przykładowy",
    status: "active_sample",
    cost: { tier: "free", note: "—" },
    quality: { quality: "sample", latency: "instant", reliability: "sample" },
    capabilities: ["captions_import", "wcag_validation", "srt_export", "vtt_export"],
    note: "Realistyczny CaptionDocument bez zewnętrznych API.",
  },
];

export const TRANSCRIPTION_PROVIDERS: ProviderCapabilityProfile[] = [
  provider("openai", "transcription", "OpenAI speech-to-text", "Dostawca transkrypcji OpenAI", "api_ready", "metered", "Pierwszy provider live: Whisper/gpt-4o-transcribe/gpt-4o-mini-transcribe.", ["batch_asr", "word_timestamps"]),
  provider("deepgram", "transcription", "Deepgram", "Deepgram", "placeholder", "metered", "Cloud ASR placeholder.", ["batch_asr", "streaming_asr", "word_timestamps"]),
  provider("assemblyai", "transcription", "AssemblyAI", "AssemblyAI", "placeholder", "metered", "Cloud ASR placeholder.", ["batch_asr", "speaker_diarization", "word_timestamps"]),
  provider("google-speech", "transcription", "Google Speech-to-Text", "Google Speech-to-Text", "placeholder", "metered", "Commercial ASR placeholder.", ["batch_asr", "word_timestamps"]),
  provider("azure-speech", "transcription", "Azure Speech", "Azure Speech", "placeholder", "metered", "Commercial ASR placeholder.", ["batch_asr", "speaker_diarization"]),
  provider("aws-transcribe", "transcription", "AWS Transcribe", "AWS Transcribe", "placeholder", "metered", "Commercial ASR placeholder.", ["batch_asr", "speaker_diarization"]),
  provider("speechmatics", "transcription", "Speechmatics", "Speechmatics", "placeholder", "premium", "High-quality commercial ASR placeholder.", ["batch_asr", "word_timestamps"]),
  provider("rev-ai", "transcription", "Rev.ai", "Rev.ai", "placeholder", "metered", "Commercial ASR placeholder.", ["batch_asr"]),
  provider("ibm-watson", "transcription", "IBM Watson Speech to Text", "IBM Watson", "placeholder", "metered", "Commercial ASR placeholder.", ["batch_asr"]),
  provider("oci-speech", "transcription", "Oracle/OCI Speech", "OCI Speech", "placeholder", "metered", "Commercial ASR placeholder.", ["batch_asr"]),
  provider("gladia", "transcription", "Gladia", "Gladia", "placeholder", "metered", "Commercial ASR placeholder.", ["batch_asr", "word_timestamps"]),
  provider("soniox", "transcription", "Soniox", "Soniox", "placeholder", "metered", "Commercial ASR placeholder.", ["batch_asr"]),
  provider("symbl", "transcription", "Symbl.ai", "Symbl.ai", "placeholder", "metered", "Conversation intelligence placeholder.", ["batch_asr", "speaker_diarization"]),
  provider("verbit", "transcription", "Verbit", "Verbit", "placeholder", "premium", "Human/enterprise captions placeholder.", ["batch_asr"]),
  provider("3play", "transcription", "3Play Media API", "3Play Media", "placeholder", "premium", "Accessibility captions service placeholder.", ["batch_asr"]),
  provider("sonix", "transcription", "Sonix API", "Sonix", "placeholder", "metered", "Commercial transcription placeholder.", ["batch_asr"]),
  provider("amberscript", "transcription", "Amberscript API", "Amberscript", "placeholder", "metered", "Commercial transcription placeholder.", ["batch_asr"]),
  provider("happy-scribe", "transcription", "Happy Scribe API", "Happy Scribe", "placeholder", "metered", "API availability TBD.", ["batch_asr"]),
  provider("trint", "transcription", "Trint API", "Trint", "placeholder", "metered", "API availability TBD.", ["batch_asr"]),
  provider("hf-endpoints", "transcription", "Hugging Face Inference Endpoints", "Hugging Face endpoints", "placeholder", "metered", "Hosted model endpoint placeholder.", ["batch_asr"]),
  provider("replicate", "transcription", "Replicate", "Replicate", "placeholder", "metered", "Hosted Whisper/model API placeholder.", ["batch_asr"]),
  provider("groq-whisper", "transcription", "Groq / hosted Whisper", "Hosted Whisper", "placeholder", "metered", "Hosted Whisper placeholder.", ["batch_asr"]),
  provider("modal-baseten-runpod", "transcription", "Modal/Baseten/RunPod hosted model API", "Hosted model infra", "placeholder", "metered", "Infrastructure placeholder for custom models.", ["batch_asr"]),
];

export const SOUND_EVENT_PROVIDERS: ProviderCapabilityProfile[] = [
  provider("sample-sound-events", "sound_events", "Wykrywanie dźwięków (przykład)", "Dźwięki (przykład)", "active_sample", "free", "Poglądowy dostawca; pokazuje docelowy przepływ.", ["sound_events"]),
  provider("manual-sound-labels", "sound_events", "Manual sound event labels", "Ręczne opisy dźwięków", "available", "free", "Użytkownik może dodać lub poprawić opis w edytorze.", ["sound_events"]),
  provider("yamnet", "sound_events", "YAMNet placeholder", "YAMNet", "placeholder", "low", "AudioSet-based classifier placeholder.", ["sound_events"]),
  provider("panns", "sound_events", "PANNs placeholder", "PANNs", "placeholder", "low", "Audio tagging placeholder.", ["sound_events"]),
  provider("audioset-classifier", "sound_events", "AudioSet classifier placeholder", "AudioSet classifier", "placeholder", "low", "AudioSet-based sound classes.", ["sound_events"]),
  provider("clap-classifier", "sound_events", "CLAP-based classifier placeholder", "CLAP classifier", "placeholder", "low", "Text/audio semantic matching placeholder.", ["sound_events"]),
  provider("custom-sound-events", "sound_events", "Custom sound event provider", "Custom provider", "placeholder", "metered", "Custom model/API adapter placeholder.", ["sound_events"]),
  provider("cloud-audio-intelligence", "sound_events", "Cloud audio intelligence provider", "Cloud audio intelligence", "placeholder", "metered", "Commercial audio intelligence placeholder.", ["sound_events"]),
  provider("human-review", "sound_events", "Human review placeholder", "Przegląd człowieka", "planned", "manual", "Optional B2B/manual QA path.", ["sound_events"]),
];

export const OTHER_PROVIDER_GROUPS: ProviderCapabilityProfile[] = [
  provider("sample-diarization", "diarization", "Diaryzacja (przykład)", "Mówcy (przykład)", "active_sample", "free", "Przykładowi mówcy w materiale przykładowym.", ["speaker_diarization"]),
  provider("pyannote-placeholder", "diarization", "Pyannote diarization placeholder", "Pyannote", "placeholder", "metered", "Future diarization adapter.", ["speaker_diarization"]),
  provider("forced-alignment", "alignment", "Forced alignment", "Dopasowanie tekstu do audio", "placeholder", "low", "Dla dostarczonego transkryptu.", ["forced_alignment", "word_timestamps"]),
  provider("whisperx-alignment", "alignment", "WhisperX alignment", "WhisperX alignment", "placeholder", "low", "Alignment/postprocess placeholder.", ["forced_alignment", "word_timestamps"]),
  provider("language-tool", "text_cleanup", "LanguageTool/text cleanup", "Korekta tekstu", "placeholder", "low", "Czyszczenie tekstu i interpunkcja.", ["text_cleanup"]),
  provider("srt-vtt-export", "export", "SRT/VTT export", "Eksport SRT/VTT", "active_sample", "free", "Działa deterministycznie z CaptionDocument.", ["srt_export", "vtt_export"]),
  provider("pdf-report", "export", "PDF WCAG report", "Raport PDF", "planned", "low", "Placeholder eksportu dokumentu audytowego.", ["pdf_report"]),
];

export const DEFAULT_PROCESSING_DECISION: ProcessingDecision = {
  strategy: "automatic",
  transcriptSource: "SRT/VTT lub transkrypt przykładowy",
  transcriptionProvider: "OpenAI jako pierwszy dostawca; przykład w trybie poglądowym",
  diarizationProvider: "Rozpoznawanie mówców (wkrótce)",
  soundEventProvider: "Wykrywanie dźwięków + ręczne opisy",
  alignmentProvider: "Forced alignment placeholder",
  textCleanupProvider: "Deterministyczne formatowanie + WCAG rules",
  exportProvider: "SRT/VTT export",
  estimatedCredits: 6,
  path: [
    "rozpoznaj źródło",
    "sprawdź istniejące napisy",
    "wybierz ASR tylko gdy potrzebny",
    "dodaj mówców i dźwięki",
    "normalizuj do CaptionDocument",
    "waliduj WCAG",
    "edytuj i eksportuj",
  ],
  reason: "Przykład pokazuje finalny przepływ; realny orkiestrator będzie wybierał najtańszą lub najlepszą ścieżkę per materiał.",
};

export const ORCHESTRATOR_STATUS = [
  { label: "Źródła napisów", value: "import działa; URL wkrótce", status: "active_sample" as ProviderStatus },
  { label: "Dostawca transkrypcji", value: "OpenAI api-ready; reszta placeholder", status: "api_ready" as ProviderStatus },
  { label: "Rozpoznawanie mówców", value: "pojedynczy mówca; rozpoznawanie wkrótce", status: "placeholder" as ProviderStatus },
  { label: "Dźwięki niewerbalne", value: "top-level capability; detekcja TBD", status: "placeholder" as ProviderStatus },
  { label: "Walidacja WCAG", value: "realne reguły WCAG", status: "active_sample" as ProviderStatus },
  { label: "Eksport", value: "SRT/VTT/TXT/JSON; PDF placeholder", status: "active_sample" as ProviderStatus },
  { label: "Koszt/kredyty", value: "szacunek poglądowy", status: "active_sample" as ProviderStatus },
];

export function statusLabel(status: ProviderStatus): string {
  return ({
    active_sample: "aktywne",
    available: "dostępne",
    api_ready: "gotowe do API",
    missing_key: "brak klucza",
    placeholder: "placeholder",
    planned: "planowane",
    disabled: "wyłączone",
    failed: "błąd",
    fallback_used: "fallback",
  })[status];
}

function provider(
  id: string,
  kind: ProviderKind,
  name: string,
  userLabel: string,
  status: ProviderStatus,
  tier: ProviderCostProfile["tier"],
  note: string,
  capabilities: ProviderCapability[],
): ProviderCapabilityProfile {
  return {
    id,
    kind,
    name,
    userLabel,
    status,
    cost: { tier, note: tier === "free" ? "darmowe/niskokosztowe" : note },
    quality: {
      quality: status === "active_sample" ? "sample" : tier === "premium" ? "high" : "standard",
      latency: status === "active_sample" ? "instant" : "standard",
      reliability: status === "active_sample" ? "sample" : "experimental",
    },
    capabilities,
    note,
  };
}
