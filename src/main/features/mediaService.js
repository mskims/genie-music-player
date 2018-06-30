import { Notification, ipcMain, globalShortcut } from 'electron'
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

export const registerMediaKeys = () => {
  globalShortcut.register('mediaplaypause', function () {
    WindowManager.get('player').webContents.send('track-playpause')
  })
  globalShortcut.register('mediaprevioustrack', function () {
   WindowManager.get('player').webContents.send('track-prev')
  })
  globalShortcut.register('medianexttrack', function () {
    WindowManager.get('player').webContents.send('track-next')
  })
}
export const unregisterMediaKeys = () => {
  globalShortcut.unregisterAll()
}