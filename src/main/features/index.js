import { app } from 'electron'
import settings from 'electron-settings'

import * as mediaService from './mediaService'
import * as autoUpdate from './autoUpdate'

const setHooks = () => {
  mediaService.setHooks()
}

export const initialize = () => {
  setHooks()


  autoUpdate.initialize()

  if (settings.get('useMediaKeys', true)) {
    mediaService.registerMediaKeys()
  }
  if (!settings.get('showOnDock', false)) {
    app.dock.hide()
  }
}
