const sessions: Record<string, any> = {};

export function getSession(phone: string) {
  return sessions[phone];
}

export function updateSession(phone: string, data: any) {
  sessions[phone] = data;
}

export function clearSession(phone: string) {
  delete sessions[phone];
}
