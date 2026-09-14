import { ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../shared/components/Button";
import { SMITH_LANGUAGES, normalizeLanguages } from "../domain/languages";
import { CharacterAvatar } from "./CharacterAvatar";

export function CharacterForm({ character, busy, onCancel, onSave }) {
  const [name, setName] = useState(character?.name || "");
  const [brief, setBrief] = useState(character?.brief || "");
  const [headerPrompt, setHeaderPrompt] = useState(character?.headerPrompt || "");
  const [languages, setLanguages] = useState(character?.allowedLanguages || ["en"]);
  const [preferredLanguage, setPreferredLanguage] = useState(character?.preferredLanguage || "en");
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  function toggleLanguage(code) {
    const next = normalizeLanguages(
      languages.includes(code) ? languages.filter((item) => item !== code) : [...languages, code]
    );
    setLanguages(next);
    if (!next.includes(preferredLanguage)) setPreferredLanguage(next[0]);
  }

  function submit(event) {
    event.preventDefault();
    onSave({
      input: { name, brief, headerPrompt, allowedLanguages: languages, preferredLanguage },
      avatarFile,
      removeAvatar
    });
  }

  return (
    <div className="smith-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <form className="smith-character-form surface" onSubmit={submit}>
        <header className="smith-form-header">
          <div>
            <span className="eyebrow">{character ? "Edit character" : "New character"}</span>
            <h2>{character ? character.name : "Create a personality"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close"><X size={20} /></button>
        </header>

        <div className="smith-avatar-editor">
          <CharacterAvatar
            character={removeAvatar ? { ...character, avatarUrl: "" } : character}
            previewUrl={previewUrl}
            size="lg"
          />
          <label className="smith-file-button">
            <ImagePlus size={18} />
            <span>Choose image</span>
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                setAvatarFile(event.target.files?.[0] || null);
                setRemoveAvatar(false);
              }}
            />
          </label>
          {character?.avatarUrl && !removeAvatar ? (
            <button type="button" className="smith-text-action smith-text-action--danger" onClick={() => { setAvatarFile(null); setRemoveAvatar(true); }}>
              <Trash2 size={16} /> Remove
            </button>
          ) : null}
        </div>

        <label className="smith-field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="e.g. Calm mentor" />
        </label>

        <label className="smith-field">
          <span>Brief description</span>
          <textarea value={brief} onChange={(event) => setBrief(event.target.value)} maxLength={500} rows={2} placeholder="A short description shown on the character card." />
        </label>

        <label className="smith-field">
          <span>Character instructions</span>
          <textarea
            value={headerPrompt}
            onChange={(event) => setHeaderPrompt(event.target.value)}
            minLength={10}
            maxLength={8000}
            rows={6}
            required
            placeholder="Explain the personality, tone, expertise, boundaries, and how this character should answer."
          />
          <small>{headerPrompt.length}/8000</small>
        </label>

        <fieldset className="smith-field">
          <legend>Conversation languages</legend>
          <div className="smith-language-grid">
            {SMITH_LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                className="smith-language-chip"
                aria-pressed={languages.includes(language.code)}
                onClick={() => toggleLanguage(language.code)}
              >
                {language.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="smith-field">
          <span>Default language</span>
          <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)}>
            {languages.map((code) => {
              const option = SMITH_LANGUAGES.find((item) => item.code === code);
              return <option key={code} value={code}>{option?.label || code}</option>;
            })}
          </select>
        </label>

        <footer className="smith-form-actions">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={busy || !name.trim() || headerPrompt.trim().length < 10}>
            {busy ? "Saving…" : character ? "Save changes" : "Create character"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
