import { useState, type ComponentType } from "react";
import { Settings, X, Sun, Moon, Eye, Type, Languages, Sparkles } from "lucide-react";
import { useA11y } from "@/contexts/A11yContext";
import { useI18n } from "@/contexts/I18nContext";

export const SettingsButton = ({ darkMode, onToggleDark }: { darkMode: boolean; onToggleDark: () => void }) => {
  const [open, setOpen] = useState(false);
  const a11y = useA11y();
  const { lang, setLang, t } = useI18n();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("settings.title")}
        className="rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:scale-105 hover:text-primary shadow-sm"
      >
        <Settings className="size-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-foreground/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("settings.title")}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft animate-scale-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-primary" /> {t("settings.title")}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Theme */}
              <Row icon={darkMode ? Moon : Sun} title={t("settings.theme")}>
                <button
                  onClick={onToggleDark}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-primary"
                >
                  {darkMode ? "Dark" : "Light"}
                </button>
              </Row>

              {/* Language */}
              <Row icon={Languages} title={t("settings.language")}>
                <div className="flex gap-1 rounded-md border border-border bg-background p-1">
                  {(["en", "am"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`rounded px-3 py-1 text-xs font-bold transition ${
                        lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {l === "en" ? "English" : "አማርኛ"}
                    </button>
                  ))}
                </div>
              </Row>

              {/* Color blind */}
              <Row icon={Eye} title={t("settings.colorblind")} hint={t("settings.colorblindHint")}>
                <Toggle on={a11y.colorBlind} onChange={(v) => a11y.update({ colorBlind: v })} />
              </Row>

              {/* Large text */}
              <Row icon={Type} title={t("settings.fontSize")}>
                <Toggle on={a11y.largeText} onChange={(v) => a11y.update({ largeText: v })} />
              </Row>

              {/* Reduce motion */}
              <Row icon={Sparkles} title={t("settings.reduceMotion")}>
                <Toggle on={a11y.reduceMotion} onChange={(v) => a11y.update({ reduceMotion: v })} />
              </Row>
              
              {/* High contrast */}
              <Row icon={Eye} title={t("settings.highContrast") || "High contrast"} hint={t("settings.highContrastHint") || "Increase UI contrast"}>
                <Toggle on={a11y.highContrast} onChange={(v) => a11y.update({ highContrast: v })} />
              </Row>
            </div>

            <p className="mt-5 text-[11px] text-muted-foreground">
              These settings are stored locally on this device.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

const Row = ({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/60 p-3">
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="size-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <button
    role="switch"
    aria-checked={on}
    onClick={() => onChange(!on)}
    className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}
  >
    <span
      className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition ${
        on ? "left-[22px]" : "left-0.5"
      }`}
    />
  </button>
);
