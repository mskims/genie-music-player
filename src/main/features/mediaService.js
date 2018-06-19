import { Notification, ipcMain } from 'electron'
import { TrayManager, WindowManager } from '../common'

export const setHooks = () => {
  ipcMain.on('track-changed', (event, track) => {
    const mainTray = TrayManager.get('main')
    mainTray.setTitle(track.title)

    if (!WindowManager.get('player').isFocused()) {
      new Notification({
        title: `${track.title} - ${track.artist}`,
        silent: true
      }).show()
    }
  })
}
