import { app } from 'electron'

import * as PlayerWindowHelper from './windows/player'
import * as TrayHelper from './windows/tray'
import * as LoginWindowHelper from './windows/login'

import * as features from './main/features'

import { updater } from 'update-electron-app'

updater()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  features.initialize()
  LoginWindowHelper.create()
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
