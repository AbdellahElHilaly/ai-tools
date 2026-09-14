import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Pencil, Plus, Trash2, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/supabase/AuthProvider";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { CharacterForm } from "../components/CharacterForm";
import { languageLabel } from "../domain/languages";
import { smithRepository } from "../services/smithRepository";

export function SmithCharactersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(undefined);
  const characters = useQuery({
    queryKey: ["smith", "characters"],
    queryFn: () => smithRepository.listCharacters(),
    enabled: Boolean(user)
  });

  const saveCharacter = useMutation({
    mutationFn: ({ input, avatarFile, removeAvatar }) => editing
      ? smithRepository.updateCharacter(editing.id, input, { avatarFile, removeAvatar })
      : smithRepository.createCharacter(input, avatarFile),
    onSuccess: async () => {
      setEditing(undefined);
      await queryClient.invalidateQueries({ queryKey: ["smith", "characters"] });
    }
  });

  const removeCharacter = useMutation({
    mutationFn: (character) => smithRepository.deleteCharacter(character),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smith"] });
    }
  });

  const startChat = useMutation({
    mutationFn: (character) => smithRepository.createSession({
      characterId: character.id,
      language: character.preferredLanguage
    }),
    onSuccess: (session) => navigate(`/smith/chat/${session.id}`)
  });

  if (authLoading) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!user) {
    return (
      <div className="page">
        <Card className="smith-empty">
          <WandSparkles size={30} />
          <h1>Sign in to create characters</h1>
          <p className="muted">Your personalities, sessions, and messages are private to your account.</p>
          <Link className="smith-primary-link" to="/config?section=account">Open account settings</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="page stack gap-5">
      <header className="smith-page-header">
        <div>
          <span className="eyebrow">Chat</span>
          <h1 className="page-title">Your characters</h1>
          <p className="page-copy">Create personalities with their own voice, instructions, image, and languages.</p>
        </div>
        <Button onClick={() => setEditing(null)}><Plus size={18} /> New character</Button>
      </header>

      {characters.isLoading ? <p className="muted">Loading characters…</p> : null}
      {characters.error || saveCharacter.error || removeCharacter.error || startChat.error ? (
        <p className="smith-error">{(characters.error || saveCharacter.error || removeCharacter.error || startChat.error)?.message}</p>
      ) : null}

      {!characters.isLoading && !characters.data?.length ? (
        <Card className="smith-empty">
          <WandSparkles size={34} />
          <h2>Shape your first personality</h2>
          <p className="muted">Give it a name, a visual identity, and precise instructions for how it should speak.</p>
          <Button onClick={() => setEditing(null)}><Plus size={18} /> Create character</Button>
        </Card>
      ) : (
        <div className="smith-character-grid">
          {characters.data?.map((character) => (
            <article className="smith-character-card surface" key={character.id}>
              <div className="smith-character-card__top">
                <CharacterAvatar character={character} size="lg" />
                <div className="smith-character-card__actions">
                  <button className="icon-button" onClick={() => setEditing(character)} aria-label={`Edit ${character.name}`}><Pencil size={17} /></button>
                  <button
                    className="icon-button smith-danger"
                    onClick={() => window.confirm(`Delete ${character.name} and all its chats?`) && removeCharacter.mutate(character)}
                    aria-label={`Delete ${character.name}`}
                  ><Trash2 size={17} /></button>
                </div>
              </div>
              <div>
                <h2>{character.name}</h2>
                <p className="muted">{character.brief || "No description yet."}</p>
              </div>
              <div className="smith-language-row">
                {character.allowedLanguages.map((code) => <span key={code}>{languageLabel(code)}</span>)}
              </div>
              <button className="smith-chat-cta" onClick={() => startChat.mutate(character)}>
                <MessageCircle size={18} /> Start chat
              </button>
            </article>
          ))}
        </div>
      )}

      {editing !== undefined ? (
        <CharacterForm
          key={editing?.id || "new"}
          character={editing || null}
          busy={saveCharacter.isPending}
          onCancel={() => setEditing(undefined)}
          onSave={(payload) => saveCharacter.mutate(payload)}
        />
      ) : null}
    </div>
  );
}
