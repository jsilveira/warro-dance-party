import React, {Component} from 'react';
import {now} from "moment";

export default class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      audio: 'paused'
    };

    this.audioRef = React.createRef();
  }

  componentDidMount() {
    this.fetchNowPlaying();
    if(this.audioRef.current) {
      this.audioRef.current.play();
    }
  }

  async fetchNowPlaying() {
    let url = 'https://warro.online/api/nowplaying/1';
    let res = await fetch(url);

    let jsonRes = await res.json();

    this.setState({metadata: jsonRes});
    console.log(jsonRes);

    this.fetchTimeout = setTimeout(() => this.fetchNowPlaying(), 5000);
  }

  componentWillUnmount() {
    clearTimeout(this.fetchTimeout || 0);
  }

  logState(state, e) {
    console.log(state);
  }

  onAudioPlaying() {
    this.setState({audio: 'playing'})
  }

  onAudioError() {
    console.log("error")
    this.setState({audio: 'error'})
  }

  onAudioWait() {
    console.log("loading")
    this.setState({audio: 'reconnecting'})
  }

  onPlay() {
    this.setState({audio: 'connecting'})
  }

  onPause() {
    this.setState({audio: 'paused'})
  }

  onVolumeChange() {
    // if(this.audioRef.current) {
    //   console.log("Volume ",this.audioRef.current.volume)
    // }
  }

  playPause() {
    if(this.audioRef.current) {
      if(this.state.audio == 'paused') {
        this.audioRef.current.play();
      } else {
        this.audioRef.current.pause();
      }
    }
  }

  render() {
    const {metadata, audio} = this.state;

    let status = "Looking for our host...";
    let whatIsPlaying = "Finding out what's playing...";
    let uniqueListeners = 0;

    if(metadata) {
      status = [];
      whatIsPlaying = [];
      let {live, listeners, now_playing, song_history, playing_next} = metadata;

      let {streamer_name, is_live} = live;
      streamer_name = streamer_name || ((playing_next || {}).playlist) || 'Auto DJ'
      if(streamer_name) {
        let [a, ... c] = streamer_name.split(' - ');

        status.push(<div key={'live'} className={'pb-1'}>
            <div className={'h4 m-0'}>
              <strong className={'align-middle text-white host-name'}>
                {a}
              </strong>
              {is_live ? <span className={'badge mr-2 badge-primary'}>Live</span> : null }
              {c.length ? <span className={'small ml-2 text-secondary'}>{c.join(' - ')}</span> : null}
            </div>
          </div>)
      } else if(streamer_name) {
        status.push(streamer_name)
      }

      if(listeners) {
        uniqueListeners = listeners.unique;
      }

      if(now_playing && now_playing.song) {
        let {title, artist, text} = now_playing.song;
        if(title && artist) {
          whatIsPlaying.push(<div key={'nowplay'} className={'text-white'}>
            <span className={'song-title'}>{title} - {artist}</span>
          </div>)
        } else {
          whatIsPlaying.push(<div key={'nowplay'} className={'h5 text-secondary'}>
            <div className={'song-title'}>{text}</div>
          </div>)
        }
      } else {
        now_playing = null;
      }
    }

    const url = "https://warro.online/radio/8000/radio.mp3?1586033987";
    // const url = "https://warro.online/radio/8010/radio.mp3?1586302213";

    return <div className={"player text-left state-"+audio}>
      <div className={'d-flex'}>
        <div className={'player-btn'} onClick={this.playPause.bind(this)}></div>

        <div className={'player-info'}>
          <div className={'d-flex justify-content-between align-items-center mb-1'}>
            <span>{status}</span>
          </div>

          <div>{whatIsPlaying}</div>
        </div>
      </div>

      <audio ref={this.audioRef} controls src={url}

             onError={() => this.onAudioError()}
             onAbort={() => this.onAudioError()}

             onWaiting={() => this.onAudioWait()}
             onPlaying={() => this.onAudioPlaying()}

             onPlay={() => this.onPlay()}
             onPause={() => this.onPause()}
             onVolumeChange={this.onVolumeChange()}
      />
      <div className={'action-header'}>
        {
          uniqueListeners ? <span className={'listeners text-primary'}>{uniqueListeners} seres escuchando</span> : null
        }
      </div>
    </div>;
  }
}