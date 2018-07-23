import { BrowserWindow } from 'electron'
import { TrayManager, WindowManager } from '../../main/common'
import { debounce } from 'throttle-debounce'
import path from 'path'
import * as constants from '../../main/constants'

export const create = () => {
  const playerWindow = new BrowserWindow({
    width: 450,
    height: 500,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'scripts/index.js'),
      backgroundThrottling: false
    },
    backgroundColor: '#ffffff'
  })

  playerWindow.on('resize', debounce(300, false, () => {
    const tray = TrayManager.get('main')

    fitWindowSizeOnTray(playerWindow, tray)
  }))

  playerWindow.on('blur', () => {
    if (!playerWindow.webContents.isDevToolsOpened() && !WindowManager.exists('popup')) {
      playerWindow.hide()
    }
  })

  playerWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    const popupWindow = new BrowserWindow({
      width: 1000,
      resizable: false,
      parent: playerWindow,
      show: false,
      webPreferences: {
        nodeIntegration: false
      }
    })

    if (url.includes('/member/popLogin')) {
      popupWindow.on('close', () => {
        reload()
      })
    }

    popupWindow.loadURL(url)

    WindowManager.set('popup', popupWindow)

    popupWindow.show()
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
  const tray = TrayManager.get('main')

  fitWindowSizeOnTray(playerWindow, tray)

  playerWindow.show()
  playerWindow.focus()
}

export const reload = () => {
  const playerWindow = WindowManager.get('player')

  playerWindow.reload()
}

const fitWindowSizeOnTray = (window, tray) => {
  const windowBounds = window.getBounds()
  const trayBounds = tray.getBounds()

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4)

  window.setPosition(x, y, false)
}

