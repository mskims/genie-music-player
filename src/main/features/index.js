import { app } from 'electron'
import settings from 'electron-settings'

import * as mediaService from './mediaService'

const setHooks = () => {
  mediaService.setHooks()
}

export const initialize = () => {
  setHooks()

  if (settings.get('useMediaKeys', true)) {
    mediaService.registerMediaKeys()
  }
  if (!settings.get('showOnDock', false)) {
    app.dock.hide()
  }
}
