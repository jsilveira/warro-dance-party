import React, {Component} from 'react';
import VolumeSlider from "./VolumeSlider";
import {UserSettings} from './UserSettings';
import _ from "lodash";
import app from "./feathers.js";

// To ensure each page reload gets a unique new stream url
const uniqueCacheBuster = new Date().valueOf();
const url = "https://radios.solumedia.com/6654/stream?"+uniqueCacheBuster;

export default class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      audio: 'paused'
    };

    this.onAudioPlaying = this.onAudioPlaying.bind(this);
    this.onAudioError = this.onAudioError.bind(this);
    this.onAudioWait = this.onAudioWait.bind(this);
    this.onVolumeChange = this.onVolumeChange.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.onPause = this.onPause.bind(this);

    this.audio = new Audio(url);
  }

  componentDidMount() {
    this.fetchNowPlaying();

    this.audio.addEventListener('playing', this.onAudioPlaying);
    this.audio.addEventListener('error', this.onAudioError);
    this.audio.addEventListener('waiting', this.onAudioWait);
    this.audio.addEventListener('volumechange', this.onVolumeChange);
    this.audio.addEventListener('play', this.onPlay);
    this.audio.addEventListener('pause', this.onPause);

    if(this.audio && localStorage.getItem('player-state') !== "paused") {
      this.audio.play().catch((err) => {
        localStorage.setItem('player-state', 'paused');        
        console.error(err);
      });
    }
  }

  async fetchNowPlaying() {
    let url = 'https://radios.solumedia.com/cp/get_info.php?p=6654';
    
      try {
        let res = await fetch(url);
        let soluMediaData = await res.json();

        let streamerName = (soluMediaData.djusername && soluMediaData.djusername === "No DJ")  ? "" : soluMediaData.djusername;

        // Transform Solumedia format to expected format
        const metadata = {
          live: {
            streamer_name: streamerName,
            is_live: !!soluMediaData.djusername
          },
          listeners: {
            unique: soluMediaData.ulistener || 0
          },
          now_playing: {
              title: soluMediaData.title,
          },
          // Additional Solumedia data
          history: soluMediaData.history
        };

        this.setState({ metadata });
        this.props.onMetadataUpdate(metadata);

        this.fetchTimeout = setTimeout(() => this.fetchNowPlaying(), 5000);
      } catch (error) {
        console.error("Error fetching metadata:", error);
        this.fetchTimeout = setTimeout(() => this.fetchNowPlaying(), 10000);
      }
  }

  componentWillUnmount() {
    clearTimeout(this.fetchTimeout || 0);

    this.audio.removeEventListener('playing', this.onAudioPlaying);
    this.audio.removeEventListener('error', this.onAudioError);
    this.audio.removeEventListener('waiting', this.onAudioWait);
    this.audio.removeEventListener('volumechange', this.onVolumeChange);
    this.audio.removeEventListener('play', this.onPlay);
    this.audio.removeEventListener('pause', this.onPause);
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
    console.log("reconnecting")
    this.setState({audio: 'reconnecting'})
  }

  onPlay() {
    localStorage.setItem('player-state', 'playing');
    this.setState({audio: 'connecting'})
    this.updateUserPlayStatus(true);
  }

  onPause() {
    localStorage.setItem('player-state', 'paused');
    this.setState({audio: 'paused'})
    this.updateUserPlayStatus(false);
  }

  onVolumeChange() {
    if(this.audio) {
      console.log("Volume ",this.audio.volume)
    }
  }

  async updateUserPlayStatus(isPlaying) {
    if (this.props.user) {
      try {
        await app.service('users').update(this.props.user.id, { isPlaying });
      } catch (err) {
        console.error('Error updating user play status:', err);
      }
    }
  }

  playPause() {
    if(this.audio) {
      if(this.state.audio == 'paused') {
        this.audio.play();
      } else {
        this.audio.pause();
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
      streamer_name = streamer_name || ((playing_next || {}).playlist) || ''
      if(streamer_name) {
        let [a, ... c] = streamer_name.split(' - ');

        status.push(<div key={'live'} className={''}>
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
        let {title, text} = now_playing.song;
        if(title) {
          whatIsPlaying.push(<div key={'nowplay'} className={'text-white'}>
            <span className={'song-title'}><em>{title}</em></span>
          </div>)
        } else {
          whatIsPlaying.push(<div key={'nowplay'} className={'text-white'}>
            <span className={'song-title'}><em>{text}</em></span>
          </div>)
        }
      } else {
        now_playing = null;
      }
    }

    return <div className={"player text-left state-"+audio}>
      <div className={'d-flex overflow-hidden'}>
        <div className={'player-btn'} onClick={this.playPause.bind(this)}><span className={'btn-play'}>Dale play</span><span className={'btn-pause'}>Pausar radio</span></div>

        <div className={'player-info'}>
          <div className={'d-flex justify-content-between align-items-center mb-1'}>
            <span>{status}</span>
          </div>

          <div>{whatIsPlaying}</div>
        </div>

        <VolumeSlider htmlAudio={this.audio}/>
      </div>

      <div className={'action-header'}>
        {
          uniqueListeners ? <span className={'listeners text-primary'}>{uniqueListeners} seres escuchando</span> : null
        }
        <a href="/agenda" target={'_blank'} className={'btn btn-secondary'}>Ver agenda</a>
        {this.props.user ? <UserSettings user={this.props.user}/> : null }
      </div>
    </div>;
  }
}
