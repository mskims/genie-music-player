import { BrowserWindow } from 'electron'
import { CurrentUser, TrayManager, WindowManager } from '../../main/common'
import path from 'path'
import * as constants from '../../main/constants'

export const create = () => {
  const playerWindow = new BrowserWindow({
    width: 450,
    height: 500,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'scripts/index.js'),
      backgroundThrottling: false,
    },
    backgroundColor: '#ffffff'
  })

  playerWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    const win = new BrowserWindow({
      width: 1000,
      resizable: false,
      parent: playerWindow,
      webPreferences: {
        nodeIntegration: false,
      }
    })

    if (url.includes('/member/popLogin')) {
      win.on('close', () => {
        playerWindow.reload()
      })
    }

    win.loadURL(url)
    event.newGuest = win
  })

  playerWindow.loadURL(constants.PLAYER_URL)

  playerWindow.webContents.once('dom-ready', show)

  WindowManager.set('player', playerWindow)

  return playerWindow
}

export const toggle = () => {
  const playerWindow = WindowManager.get('player')

  if (playerWindow.isVisible()) {
    playerWindow.hide()
  } else {
    show()
  }
}

export const show = () => {
  const playerWindow = WindowManager.get('player')
  const position = getPosition()
  playerWindow.setPosition(position.x, position.y, false)
  playerWindow.show()
  playerWindow.focus()
}

const getPosition = () => {
  const windowBounds = WindowManager.get('player').getBounds()
  const trayBounds = TrayManager.get('main').getBounds()

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4)

  return {x: x, y: y}
}
