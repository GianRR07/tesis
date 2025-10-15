export function getSession() {
  try {
    return JSON.parse(localStorage.getItem("session")) || null;
  } catch {
    return null;
  }
}

export function getTutorAulaIdPreferida() {
  const ses = getSession();
  const aulas = ses?.roles?.tutor?.aulas || [];
  // Usa la primera aula asignada al tutor
  return aulas.length > 0 ? aulas[0]?.id : null;
}

export function getDocenteIdPreferido() {
  const ses = getSession();
  // el login devuelve { userType, docente: { id, ... }, roles: {...} }
  return ses?.docente?.id ?? ses?.user?.id ?? null;
}

export function getUserId() {
  const ses = getSession();
  return ses?.docente?.id ?? ses?.tutor?.id ?? ses?.user?.id ?? null;
}

export function getUserRole() {
  const ses = getSession();
  return ses?.userType ?? "desconocido";
}
