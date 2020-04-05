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
    if(this.audioRef.current) {
      console.log(this.audioRef.current.volume)
    }
  }

  render() {
    const {metadata, audio} = this.state;

    let status = "Looking for our host...";
    let whatIsPlaying = "Finding out what's playing...";

    if(metadata) {
      status = [];
      whatIsPlaying = [];
      let {live, listeners, now_playing, song_history} = metadata;

      let {streamer_name, is_live} = live;

      if(is_live) {
        let [a, ... c] = streamer_name.split(' - ');

        status.push(<div key={'live'} className={'pb-1'}>
            <div className={'h4'}>
              <span className={'badge badge-primary'}>Live</span>
              <span className={'align-middle ml-2 text-white'}>
                {a}
              </span>
              {c.length ? <span className={'small ml-2 text-secondary'}>{c.join(' - ')}</span> : null}
            </div>
          </div>)
      } else if(streamer_name) {
        status.push(streamer_name)
      }

      if(now_playing && now_playing.song) {
        let {title, artist, text} = now_playing.song;
        if(title && artist) {
          whatIsPlaying.push(<div key={'nowplay'} className={'text-white'}>
            <span className={'song-title'}>{title}</span>
            &nbsp;&nbsp;&nbsp;<span className={'artist'}>{artist}</span>
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

    return <div className={"player text-left state-"+audio}>
      <div>{status}</div>

      <div>{whatIsPlaying}</div>
      {/*<div className={'h5'}>*/}
      {/*  <span className={`badge badge-${audio == 'playing' ? 'success' : 'warning'}`}>{audio}</span>*/}
      {/*</div>*/}
      {/*<iframe src="silence.mp3" id="audio" style={{display: 'none'}}/>*/}

      <audio         ref={this.audioRef} controls src={url}


                     onError={() => this.onAudioError()}
                     onAbort={() => this.onAudioError()}

                     onWaiting={this.logState.bind(this, 'onwaiting')}
                     onPlaying={() => this.onAudioPlaying()}

                     onPlay={() => this.onPlay()}
                     onPause={() => this.onPause()}
                     onVolumeChange={this.onVolumeChange()}

        // onCanPlay={this.logState.bind(this, 'oncanplay')}
        // onCanPlayThrough={this.logState.bind(this, 'oncanplaythrough')}
        // onDurationChange={this.logState.bind(this, 'ondurationchange')}
        // onEmptied={this.logState.bind(this, 'onemptied')}
        // onEnded={this.logState.bind(this, 'onended')}
        // onLoadedData={this.logState.bind(this, 'onloadeddata')}
        // onLoadedMetadata={this.logState.bind(this, 'onloadedmetadata')}
        // onLoadStart={this.logState.bind(this, 'onloadstart')}
        // onProgress={this.logState.bind(this, 'onprogress')}
        // onRateChange={this.logState.bind(this, 'onratechange')}
        // onSeeked={this.logState.bind(this, 'onseeked')}
        // onSeeking={this.logState.bind(this, 'onseeking')}
        // onSuspend={this.logState.bind(this, 'onsuspend')}
        // onTimeUpdate={this.logState.bind(this, 'ontimeupdate')}

      />
    </div>;
  }
}