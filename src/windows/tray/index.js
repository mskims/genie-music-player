import path from 'path'

import {Tray, Menu, app} from 'electron'
const settings = require('electron-settings')
const AutoLaunch = require('auto-launch')

import {TrayManager} from '../../main/common'
import * as player from '../player'
import {logout} from '../../main/features/auth'
import {registerMediaKeys, unregisterMediaKeys} from '../../main/features/mediaService'

export const create = () => {
  const mainTray = new Tray(path.join(__dirname, '../../../assets/trayTemplate.png'))
  
  const autoLauncher = new AutoLaunch({name: 'Genie'})
  
  const rightClickMenu = Menu.buildFromTemplate([
    {label: '플레이어 열기', click() { player.toggle() }},
    {type: 'separator'},
    {label: 'Mac 시작시 자동 실행', type: 'checkbox', checked: autoLauncher.isEnabled(), click(menuItem) {
      if (menuItem.checked) {
        autoLauncher.enable()
      }else{
        autoLauncher.disable()
      }
    }},
    {label: '미디어키 사용', type: 'checkbox', checked: settings.get('useMediaKeys', true), click(menuItem) {
      settings.set('useMediaKeys', menuItem.checked)
      if (menuItem.checked) {
        registerMediaKeys()
      }else{
        unregisterMediaKeys()
      }
    }},
    {label: 'Dock에서 보기', type: 'checkbox', checked: settings.get('showOnDock', false), click(menuItem) {
      settings.set('showOnDock', menuItem.checked)
      if (menuItem.checked) {
        app.dock.show()
      }else{
        app.dock.hide()
      }
    }},
    {type: 'separator'},
    //{label: '로그아웃', click() { logout() }},
    {label: '종료', role: 'quit'},
  ])
  mainTray.on('right-click', () => {
    mainTray.popUpContextMenu(rightClickMenu)
  })
  
  mainTray.on('click', () => {
    player.toggle()
  })
  mainTray.setTitle('로그인이 필요합니다')

  TrayManager.set('main', mainTray)

  return mainTray
}
