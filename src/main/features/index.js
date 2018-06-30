import { app } from 'electron'
const settings = require('electron-settings')

import * as auth from './auth'
import * as mediaService from './mediaService'

const setHooks = () => {
  auth.setHooks()
  mediaService.setHooks()
}

export const initialize = () => {
  setHooks()
  auth.submitStoredCredential()
  
  if (settings.get('useMediaKeys', true)) {
    mediaService.registerMediaKeys()
  }
  if (settings.get('showOnDock', false) == false) {
    app.dock.hide()
  }
}