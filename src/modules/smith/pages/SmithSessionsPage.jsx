import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/supabase/AuthProvider";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { languageLabel } from "../domain/languages";
import { smithRepository } from "../services/smithRepository";

export function SmithSessionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [characterId, setCharacterId] = useState("");
  const [language, setLanguage] = useState("en");

  const characters = useQuery({
    queryKey: ["smith", "characters"],
    queryFn: () => smithRepository.listCharacters(),
    enabled: Boolean(user)
  });
  const sessions = useQuery({
    queryKey: ["smith", "sessions"],
    queryFn: () => smithRepository.listSessions(),
    enabled: Boolean(user)
  });

  const selectedCharacter = characters.data?.find((item) => item.id === characterId);
  useEffect(() => {
    if (!characterId && characters.data?.length) {
      setCharacterId(characters.data[0].id);
      setLanguage(characters.data[0].preferredLanguage);
    }
  }, [characterId, characters.data]);

  const createSession = useMutation({
    mutationFn: () => smithRepository.createSession({ characterId, language }),
    onSuccess: (session) => navigate(`/smith/chat/${session.id}`)
  });
  const deleteSession = useMutation({
    mutationFn: (id) => smithRepository.deleteSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["smith", "sessions"] })
  });
  const renameSession = useMutation({
    mutationFn: ({ id, title }) => smithRepository.renameSession(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["smith", "sessions"] })
  });

  function rename(session) {
    const title = window.prompt("Rename conversation", session.title)?.trim();
    if (title && title !== session.title) renameSession.mutate({ id: session.id, title });
  }

  if (!user) {
    return <div className="page"><Card className="smith-empty"><h1>Sign in to view chats</h1><Link className="smith-primary-link" to="/config?section=account">Open account settings</Link></Card></div>;
  }

  return (
    <div className="page stack gap-5">
      <header className="smith-page-header">
        <div>
          <span className="eyebrow">Smith</span>
          <h1 className="page-title">Chat history</h1>
        </div>
        <Button onClick={() => setCreating((value) => !value)} disabled={!characters.data?.length}><Plus size={18} /> New session</Button>
      </header>

      {creating ? (
        <Card as="form" className="smith-new-session" onSubmit={(event) => { event.preventDefault(); createSession.mutate(); }}>
          <label className="smith-field">
            <span>Character</span>
            <select value={characterId} onChange={(event) => {
              const id = event.target.value;
              const character = characters.data?.find((item) => item.id === id);
              setCharacterId(id);
              setLanguage(character?.preferredLanguage || "en");
            }}>
              {characters.data?.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
            </select>
          </label>
          <label className="smith-field">
            <span>Language</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {selectedCharacter?.allowedLanguages.map((code) => <option key={code} value={code}>{languageLabel(code)}</option>)}
            </select>
          </label>
          <Button type="submit" disabled={!characterId || createSession.isPending}>Create</Button>
        </Card>
      ) : null}

      {!characters.isLoading && !characters.data?.length ? (
        <Card className="smith-empty">
          <MessageCircle size={32} />
          <h2>Create a character first</h2>
          <Link className="smith-primary-link" to="/smith">Go to characters</Link>
        </Card>
      ) : null}

      {sessions.error || createSession.error || deleteSession.error || renameSession.error ? (
        <p className="smith-error">{(sessions.error || createSession.error || deleteSession.error || renameSession.error)?.message}</p>
      ) : null}

      <div className="smith-session-list">
        {sessions.data?.map((session) => (
          <article className="smith-session-card surface" key={session.id}>
            <Link className="smith-session-card__main" to={`/smith/chat/${session.id}`}>
              <CharacterAvatar character={session.character} />
              <span>
                <strong>{session.title}</strong>
                <small>{session.character?.name} · {languageLabel(session.language)}</small>
              </span>
            </Link>
            <div className="smith-session-card__actions">
              <button className="icon-button" onClick={() => rename(session)} aria-label="Rename conversation"><Pencil size={17} /></button>
              <button
                className="icon-button smith-danger"
                onClick={() => window.confirm("Delete this conversation?") && deleteSession.mutate(session.id)}
                aria-label="Delete conversation"
              ><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
