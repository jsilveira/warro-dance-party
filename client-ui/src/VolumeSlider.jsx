import React, {Component} from "react";
import _ from 'lodash'

export default class VolumeSlider extends React.PureComponent {
  constructor(props) {
    super(props);

    this.barRef = React.createRef();

    let lastVolume = localStorage.getItem('player-volume');

    if(lastVolume) {
      let vol = parseFloat(lastVolume);
      this.state = {volume: vol, muted: vol === 0}
    } else {
      this.state = {volume: props.htmlAudio ? props.htmlAudio.volume : 1}
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.htmlAudio && this.props.htmlAudio && this.props.htmlAudio.volume !== this.state.volume) {
      this.props.htmlAudio.volume = this.state.volume;
    }
  }

  componentDidMount() {
    //TODO: Hook to htmlAudio volume changes
    if (this.props.htmlAudio && this.props.htmlAudio.volume !== this.state.volume) {
      this.props.htmlAudio.volume = this.state.volume;
    }
  }

  componentWillUnmount() {
    //TODO: Unhook to htmlAudio volume changes
  }

  onSoundVolumeChanged() {
    //TODO
  }

  mute() {
    if(this.state.muted) {
      // If the volume was 0, set it to 1
      this.setState({muted: false, volume: this.state.volume || 1});
      this.setAudioVol(this.state.volume || 1);
    } else {
      this.setState({muted: true})
      this.setAudioVol(0);
    }
  }

  setAudioVol(vol) {
    if(this.props.htmlAudio) {
      this.props.htmlAudio.volume = vol;
      // Set for future pageviews
      localStorage.setItem('player-volume', vol);
    }
  }

  handleBarMouseDown(e) {
    if(this.barRef.current) {
      const {left, width} = this.barRef.current.getBoundingClientRect();
      const clickPos = e.clientX;
      let volume = (clickPos - left) / width;
      volume = Math.min(1, Math.max(0, volume));
      this.setState({volume, draggingStart: clickPos, muted: false})
      this.setAudioVol(volume)
    }
  }

  handleBarMouseMove(e) {
    let dragStart = this.state.draggingStart;
    if(this.barRef.current && dragStart) {
      const {left, width} = this.barRef.current.getBoundingClientRect();
      const clickPos = e.clientX;
      let volume = (clickPos - left) / width;
      volume = Math.min(1, Math.max(0, volume))
      this.setState({volume, draggingStart: clickPos, muted: false })
      this.setAudioVol(volume)
    }
  };

  stopDragging(e) {
    this.setState({draggingStart: null})
  }


  render() {
    let {volume, muted} = this.state;

    let volumeIcon = 'volume_up';
    if(muted) {
      volumeIcon = 'volume_off';
      volume = 0;
    } else if(volume === 0) {
      volumeIcon = 'volume_mute'
    } else if(volume < 0.9) {
      volumeIcon = 'volume_down'
    }


    let volPositionStyle = {
      left: `${volume*100}%`
    };

    return <div className={'volume-slider'+(muted ? ' muted' : '')}
                onMouseLeave={this.stopDragging.bind(this)}
                onMouseMove={this.handleBarMouseMove.bind(this)}>

      <span className={'btn-volume'} onClick={() => this.mute()}>
        <i className={'material'}/><i className="material-icons">{volumeIcon}</i>
      </span>

      <div className={'volume-bar-mouse-area'}
            onMouseDown={this.handleBarMouseDown.bind(this)}
            onMouseUp={this.stopDragging.bind(this)}>

        <div className={'volume-bar'} ref={this.barRef}>
          <span className={'volume-level-mark'} style={volPositionStyle}/>
        </div>
      </div>
    </div>
  }
};