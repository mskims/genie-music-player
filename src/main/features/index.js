import { app } from 'electron'
const settings = require('electron-settings')

import * as mediaService from './mediaService'

const setHooks = () => {
  mediaService.setHooks()
}

export const initialize = () => {
  setHooks()

  if (settings.get('useMediaKeys', true)) {
    mediaService.registerMediaKeys()
  }
  if (settings.get('showOnDock', false) == false) {
    app.dock.hide()
  }
}