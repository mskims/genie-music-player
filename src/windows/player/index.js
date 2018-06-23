import { BrowserWindow } from 'electron'
import { CurrentUser, TrayManager, WindowManager } from '../../main/common'
import path from 'path'
import * as LoginWindowHelper from '../login'
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
      backgroundThrottling: false
    },
    backgroundColor: '#ffffff'
  })

  // Hide the window when it loses focus
  playerWindow.on('blur', () => {
    if (!playerWindow.webContents.isDevToolsOpened()) {
      playerWindow.hide()
    }
  })

  playerWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    const win = new BrowserWindow({
      width: 1000,
      resizable: false
    })
    win.loadURL(url)
    event.newGuest = win
  })


  WindowManager.set('player', playerWindow)

  return playerWindow
}

export const loadPlayer = () => {
  const playerWindow = WindowManager.get('player')

  playerWindow.loadURL(constants.PLAYER_URL)

  return new Promise(resolve => {
    playerWindow.webContents.once('dom-ready', resolve)
  })
}

export const login = (id, password) => {
  const playerWindow = WindowManager.get('player')

  // clear cookies
  playerWindow.webContents.session.clearStorageData({
    storages: ['cookies']
  })

  playerWindow.loadURL(constants.LOGIN_URL, {
    postData: [{
      type: 'rawData',
      bytes: Buffer.from(`login_http=https&uxd=${id}&uxx=${password}&uxglk=0`)
    }],
    extraHeaders: 'Content-Type: application/x-www-form-urlencoded'
  })

  return new Promise((resolve, reject) => {
    const listner = async () => {
      const msgStr = await playerWindow.webContents.executeJavaScript(`typeof msgStr === 'string' ? msgStr : ''`, true)

      if (typeof msgStr === 'string') {
        playerWindow.webContents.removeListener('dom-ready', listner)
      }
      const isLoginSucceed = msgStr === '성공'

      resolve(id)
      if (isLoginSucceed) {
        resolve(id)
      } else {
        reject(msgStr || '지니 서비스가 점검중 입니다.')
      }
    }
    playerWindow.webContents.on('dom-ready', listner)
  })
}

export const toggle = () => {
  const playerWindow = WindowManager.get('player')

  if (!CurrentUser.isLogged) {
    if (WindowManager.exists('login')) {
      WindowManager.get('login').focus()
    } else {
      LoginWindowHelper.create()
    }
  } else if (playerWindow.isVisible()) {
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
