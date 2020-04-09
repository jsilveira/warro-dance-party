import React, {Component} from "react";
import _ from 'lodash'

export default class VolumeSlider extends React.PureComponent {
  constructor(props) {
    super(props);

    this.barRef = React.createRef();

    this.state = {
      volume: props.htmlAudio ? props.htmlAudio.volume : 1
    }
  }

  componentDidMount() {
    //TODO: Hook to htmlAudio volume changes
  }

  componentWillUnmount() {
    //TODO: Unhook to htmlAudio volume changes
  }

  onSoundVolumeChanged() {
    //TODO
  }

  mute() {
    if(this.state.muted) {
      this.setState({muted: false});
      this.setAudioVol(this.state.volume);
    } else {
      this.setState({muted: true})
      this.setAudioVol(0);
    }
  }

  setAudioVol(vol) {
    if(this.props.htmlAudio) {
      this.props.htmlAudio.volume = vol;
      console.log("Volume", vol)
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