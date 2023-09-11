export const getToken = () => {
  return localStorage.getItem('avatarToken') || ''
}

export const setToken = (newToken: string) => {
  localStorage.setItem('avatarToken', newToken)
}
