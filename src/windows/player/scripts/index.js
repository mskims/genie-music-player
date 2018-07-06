if (location.pathname === '/player/fPlayer') {
  window.onload = () => {
    const ipc = require('electron').ipcRenderer

    const GenieMusic = require('genie-music')
    const genie = new GenieMusic()
    window.genie = genie

    genie.on('track-changed', (track) => {
      ipc.send('track-changed', track)
    })
    
    ipc.on('track-playpause', (e) => {
      document.getElementsByClassName('fp-playbtn')[0].click()
    })
    ipc.on('track-prev', (e) => {
      document.getElementsByClassName('fp-prev')[0].click()
    })
    ipc.on('track-next', (e) => {
      document.getElementsByClassName('fp-next')[0].click()
    })
    
    // 다른 기기에서 로그인, 종량제 이용 내역 알림 등 전면 팝업
    FG_layerPopup.__proto__.og_show = FG_layerPopup.__proto__.show;
    FG_layerPopup.__proto__.show = function() {
      ipc.send('event-FG_layerPopup')
      this.og_show.apply(this, arguments);
    }
    
    // 19금, 1분 미리듣기 등 우측 하단 팝업
    // html이 포함된 경우도 있음
    const og_toastPopup = toastPopup;
    window.toastPopup = function() {
      ipc.send('event-toastPopup')
      og_toastPopup.apply(null, arguments);
    }
    
    const og_alert = alert;
    window.alert = function() {
      ipc.send('event-alert', arguments[0])
      //og_alert.apply(null, arguments);
    }
  }
} else {
  location.replace('/player/fPlayer')
}