import Emitter from 'events'

class Track {
    constructor({id, title, artist, album, albumArt, durationInMs}) {
        this.id = id
        this.title = title
        this.artist = artist
        this.album = albumArt
        this.durationInMs = durationInMs
    }
}

class GenieMusic extends Emitter {
    constructor() {
        super()

        this._setHooks()
    }

    _getCurrentTrack() {
        const $albumImgArea = document.querySelector('#AlbumImgArea img')
        const durationInMs = (rawDuration => {
            const [minutes, seconds] = rawDuration.split(':').map(Number)
            return (minutes * 60 + seconds) * 1000
        })(document.querySelector('.fp-duration').textContent)

        return new Track({
            id: document.querySelector('#music-tab .this-play').getAttribute('music-id'),
            title: document.querySelector('#SongTitleArea').textContent,
            artist: document.querySelector('#ArtistNameArea').textContent,
            album: $albumImgArea.alt,
            albumArt: $albumImgArea.src,
            durationInMs,
        })
    }

    _getIsPlaying() {
        return document.querySelector('#fp-audio').classList.contains('is-playing')
    }

    _setHooks() {
        this._setCurrentTrackHook()
        this._setIsPlayingHook()
    }

    _setCurrentTrackHook() {
        new MutationObserver(() => {
            const currentTrack = this._getCurrentTrack()
            this.emit('change:track', currentTrack)
        }).observe(document.querySelector('.fp-duration'), {
            childList: true,
        })
    }

    _setIsPlayingHook() {
        new MutationObserver(() => {
            const isPlaying = this._getIsPlaying()
            this.emit('change:isPlaying', isPlaying)
        }).observe(document.querySelector('.fp-playbtn'), {
            childList: true,
        })
    }
}


export default GenieMusic
