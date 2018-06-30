import * as auth from './auth'
import * as mediaService from './mediaService'

const setHooks = () => {
  auth.setHooks()
  mediaService.setHooks()
}

export const initialize = () => {
  setHooks()
  auth.submitStoredCredential()
  mediaService.registerMediaKeys()
}