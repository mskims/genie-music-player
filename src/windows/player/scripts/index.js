console.log(1)
if (location.pathname === '/player/fPlayer') {
  window.onload = () => {
    console.log(1)
    const ipc = require('electron').ipcRenderer

    const GenieMusic = require('genie-music')
    const genie = new GenieMusic()
    window.genie = genie

    genie.on('track-changed', (track) => {
      ipc.send('track-changed', track)
    })
  }
}
