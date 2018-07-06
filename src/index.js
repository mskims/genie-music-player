import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import initECM from 'electron-context-menu'
import * as Sentry from '@sentry/electron'

import * as PlayerWindowHelper from './windows/player'
import * as TrayHelper from './windows/tray'
import * as features from './main/features'

initECM()

Sentry.init({
  dsn: 'https://07f8dc95e4774f0aab891c65271dbd17@sentry.io/1234376'
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify()

  features.initialize()
  PlayerWindowHelper.create()
  TrayHelper.create()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  PlayerWindowHelper.show()
})
