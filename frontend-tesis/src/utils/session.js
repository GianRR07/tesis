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
