import { UserRound } from "lucide-react";

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function CharacterAvatar({ character, size = "md", previewUrl = "" }) {
  const source = previewUrl || character?.avatarUrl;
  const label = character?.name || "Character";
  if (source) {
    return <img className={`smith-avatar smith-avatar--${size}`} src={source} alt="" />;
  }
  return (
    <span className={`smith-avatar smith-avatar--${size} smith-avatar--fallback`} aria-label={`${label} profile`}>
      {initials(label) || <UserRound size={20} aria-hidden="true" />}
    </span>
  );
}
