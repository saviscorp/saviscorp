const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function setAuthCookie(uid: string) {
  document.cookie = `savis_uid=${uid}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

export function setRoleCookie(role: string) {
  document.cookie = `savis_role=${role}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

export function clearAuthCookies() {
  document.cookie = 'savis_uid=; path=/; max-age=0'
  document.cookie = 'savis_role=; path=/; max-age=0'
}
