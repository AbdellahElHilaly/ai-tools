import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../../core/supabase/AuthProvider";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { languageLabel } from "../domain/languages";
import { smithAiService } from "../services/smithAiService";
import { smithRepository } from "../services/smithRepository";

export function SmithChatPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  const session = useQuery({
    queryKey: ["smith", "session", sessionId],
    queryFn: () => smithRepository.getSession(sessionId),
    enabled: Boolean(user && sessionId)
  });
  const messages = useQuery({
    queryKey: ["smith", "messages", sessionId],
    queryFn: () => smithRepository.listMessages(sessionId),
    enabled: Boolean(user && sessionId)
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

  const send = useMutation({
    mutationFn: async (content) => {
      await smithRepository.addUserMessage(sessionId, content);
      await queryClient.invalidateQueries({ queryKey: ["smith", "messages", sessionId] });
      return smithAiService.reply(sessionId);
    },
    onSuccess: () => setDraft(""),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["smith", "messages", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["smith", "session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["smith", "sessions"] });
    }
  });

  const editMessage = useMutation({
    mutationFn: ({ id, content }) => smithRepository.editMessage(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["smith", "messages", sessionId] })
  });
  const deleteMessage = useMutation({
    mutationFn: (id) => smithRepository.deleteMessage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["smith", "messages", sessionId] })
  });

  function submit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || send.isPending) return;
    send.mutate(content);
  }

  function edit(message) {
    const content = window.prompt("Edit message", message.content)?.trim();
    if (content && content !== message.content) editMessage.mutate({ id: message.id, content });
  }

  if (!user) return <div className="page"><p>Sign in to open this conversation.</p></div>;
  if (session.isLoading) return <div className="page"><p className="muted">Loading conversation…</p></div>;
  if (!session.data) return <div className="page"><p>Conversation not found.</p><Link to="/smith/chats">Back to chats</Link></div>;

  return (
    <div className="smith-chat-page">
      <header className="smith-chat-header">
        <Link className="icon-button" to="/smith/chats" aria-label="Back to chats"><ArrowLeft size={20} /></Link>
        <CharacterAvatar character={session.data.character} />
        <div>
          <strong>{session.data.character?.name}</strong>
          <small>{languageLabel(session.data.language)}</small>
        </div>
      </header>

      <main className="smith-message-list" aria-live="polite">
        {!messages.isLoading && !messages.data?.length ? (
          <div className="smith-chat-welcome">
            <CharacterAvatar character={session.data.character} size="lg" />
            <h1>Talk with {session.data.character?.name}</h1>
            <p>{session.data.character?.brief || "Start the conversation whenever you are ready."}</p>
          </div>
        ) : null}

        {messages.data?.map((message) => (
          <article className={`smith-message smith-message--${message.role}`} key={message.id}>
            <div className="smith-message__content">{message.content}</div>
            <footer>
              {message.edited_at ? <small>edited</small> : <span />}
              <span>
                <button onClick={() => edit(message)} aria-label="Edit message"><Pencil size={14} /></button>
                <button onClick={() => window.confirm("Delete this message?") && deleteMessage.mutate(message.id)} aria-label="Delete message"><Trash2 size={14} /></button>
              </span>
            </footer>
          </article>
        ))}
        {send.isPending ? <div className="smith-typing" aria-label="Character is typing"><span /><span /><span /></div> : null}
        {send.error ? <p className="smith-error smith-chat-error">{send.error.message}</p> : null}
        <div ref={endRef} />
      </main>

      <form className="smith-composer" onSubmit={submit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(event);
            }
          }}
          rows={1}
          maxLength={20000}
          placeholder={`Message ${session.data.character?.name}`}
          aria-label="Message"
        />
        <button type="submit" disabled={!draft.trim() || send.isPending} aria-label="Send message"><Send size={19} /></button>
      </form>
    </div>
  );
}
