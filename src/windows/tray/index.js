import path from 'path'

import {Tray} from 'electron'

import {TrayManager} from '../../main/common'
import * as player from '../player'

export const create = () => {
  const mainTray = new Tray(path.join(__dirname, '../../../assets/trayTemplate.png'))
  mainTray.on('right-click', player.toggle)
  mainTray.on('double-click', player.toggle)
  mainTray.on('click', () => {
    player.toggle()
  })
  mainTray.setTitle('로그인이 필요합니다')

  TrayManager.set('main', mainTray)

  return mainTray
}
