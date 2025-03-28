import _ from 'lodash';
import React, {Component} from 'react';

import client from './feathers';
import Player from './Player';
import OnlineUsersWithReactions from "./OnlineUsersWithReactions";
import SendMsgBar from "./SendMsgBar";
import ChatConversation from "./ChatConversation";


class DanceFloor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      logo: 'w',
    };

    this.onAuthenticated = this.onAuthenticated.bind(this);
  }

  onAuthenticated({user}) {
    this.setState({user});
  }

  onMetadataUpdate(metadata) {
    let logo = 'w';
    if (metadata.live && (metadata.live.streamer_name || '').match(/joya/i)) {
      logo = 'joya';
    }

    if (metadata.live && (metadata.live.streamer_name || '').match(/radioaustral/i)) {
      logo = 'radioaustral';
    }

    if (this.state.logo !== logo) {
      this.setState({logo})
    }
  }

  componentDidMount() {
    client.on("authenticated", this.onAuthenticated);
  }

  componentWillUnmount() {
    // Clean up listeners
    client.off("authenticated", this.onAuthenticated);
  }

  render() {
    let start = new Date();

    let logoName = this.state.logo;

    let res = <div className="dancefloor">
      <ChatConversation user={this.props.user}/>

      <div className="player-controls">
        <Player onMetadataUpdate={this.onMetadataUpdate.bind(this)} user={this.props.user}/>
      </div>

      {this.props.connected ?
        <div className="logo-container">
          <div className={`logo ${logoName} clone`}/>
          <div className={`logo ${logoName}`}/>
        </div>
        : <div className="logo-container">
          <div className={'connecting text-white'}>Conectando...</div>
        </div>
      }

      <OnlineUsersWithReactions/>

    </div>;
    return res;
  }
}

export default DanceFloor;
