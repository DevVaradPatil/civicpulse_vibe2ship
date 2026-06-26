// Lightweight anonymous identity (localStorage). Swappable for a Firebase Auth uid later.
const KEY = "cp_identity";

export interface Identity {
  uid: string;
  name: string;
}

export function getIdentity(): Identity {
  if (typeof window === "undefined") return { uid: "", name: "" };
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Identity;
    } catch {
      /* fall through */
    }
  }
  const id: Identity = { uid: crypto.randomUUID(), name: "" };
  localStorage.setItem(KEY, JSON.stringify(id));
  return id;
}

export function setName(name: string): Identity {
  const id = getIdentity();
  id.name = name.trim().slice(0, 40);
  localStorage.setItem(KEY, JSON.stringify(id));
  return id;
}
