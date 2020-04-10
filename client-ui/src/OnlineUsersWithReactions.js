import React, {Component} from "react";
import _ from 'lodash'
import Avatar from "./avatar";
import Reactions from "./reactions";
import client from "./feathers";

export default class OnlineUsersWithReactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userStates: {}
    };

    this.reactionsTimeouts = {};

    this.areaRef = React.createRef();
    this.handleMsg = this.handleMsg.bind(this);
  }

  componentDidMount() {
    client.service('messages').on('created', this.handleMsg);
  }

  componentWillUnmount() {
    // Clean up listeners
    client.service('messages').removeListener('created', this.handleMsg);
  }

  handleMsg({text, userId}) {
    this.state.userStates[userId] = ['user-sent-msg'];

    clearTimeout(this.reactionsTimeouts[userId]);

    this.reactionsTimeouts[userId] = setTimeout(() => {
      this.state.userStates[userId] = [];
      this.setState({userStates: this.state.userStates})
    }, 1500);

    this.setState({userStates: this.state.userStates})
  }

  getCirclePositionOffsetFromCenter(userIndex) {
    let total = this.props.users.length;

    let circleDiameter = 50;

    let rows = [
      [14, 150], // Row 1
      [17, 210], // Row 1
      [23, 270], // Row 2
      [31, 330], // Row 3
      [41, 390], // Row 3
    ];

    let d = null;
    let seat = userIndex + 1;
    let rowSeats = 1;
    let previousRowsSeats = 0;

    for (const [rowMaxUsers, rowDistanceToCenter] of rows) {
      if (seat <= rowMaxUsers) {
        d = rowDistanceToCenter;
        rowSeats = rowMaxUsers;
        break;
      }
      // Row full, try next row
      seat = seat - rowMaxUsers;
      previousRowsSeats += rowMaxUsers;
    }

    let angle = seat * (360 / Math.min(total - previousRowsSeats, rowSeats)) / 360 * 2 * Math.PI;
    let top = d * Math.sin(angle) - circleDiameter / 2;
    let left = d * Math.cos(angle) - circleDiameter / 2;

    return {left, top}
  }

  getCirclePositionStyle(index) {
    let {left, top} = this.getCirclePositionOffsetFromCenter(index);

    return {
      marginTop: `${top}px`,
      marginLeft: `${left}px`
    };
  }

  getUserPosition(userId) {
    if (this.areaRef.current) {
      let pos = _.findIndex(this.props.users, u => u.id === userId);

      let {x, y, width, height, top, right, bottom, left} = this.areaRef.current.getBoundingClientRect();

      let userPos = this.getCirclePositionOffsetFromCenter(pos);

      // Absolute position of the user with a random offset movement
      let l = 0.5 * width + userPos.left + left + (Math.random() * 60 - 30);
      let t = 0.5 * height + userPos.top + top + (Math.random() * 20 - 10) - 10;

      return {
        left: `${l}px`,
        top: `${t}px`,
      }
    } else {
      return {
        left: `${Math.random() * 50 + 25}%`,
        top: `${Math.random() * 50 + 25}%`,
      }
    }
  }

  render() {
    let {users} = this.props;
    let {userStates} = this.state;

    let userAvatars = users.map((user, i) => {
      return <Avatar user={user} key={user.id} index={i} total={users.length}
                     className={'circle-position ' + ((userStates[user.id] || []).join(' '))}
                     style={this.getCirclePositionStyle(i)}/>;
    });

    return <div ref={this.areaRef} className={"online-users " + (users.length > 70 ? 'many-users' : '')}>
      <Reactions getUserPositionStyle={this.getUserPosition.bind(this)}/>

      {userAvatars}
    </div>
  }
};