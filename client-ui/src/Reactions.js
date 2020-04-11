import React, {Component} from 'react';
import client from './feathers';
import _ from 'lodash';
import Avatar from "./avatar";
import {emojis, isEmoji, findEmojis} from './../../server/src/emojis';

const sleep = async time => new Promise(r => setTimeout(r, time));


export default class Reactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      reactions: []
    };

    this.handleMsg = this.handleMsg.bind(this);

  }

  componentDidMount() {
    client.service('messages').on('created', this.handleMsg);
  }

  componentWillUnmount() {
    // Clean up listeners
    client.service('messages').removeListener('created', this.handleMsg);
  }

  async addTextReaction(text, userId) {
    const extraClasses = [];

    let allEmojis = findEmojis(text);

    if(allEmojis.length > 1 && allEmojis.join('') === text) {
      for(const emoji of allEmojis.slice(0,50)) {
        this.addTextReaction(emoji, userId);
        await sleep(350);
      }
      return;
    }

    let isEmojiOrLetter = text.length <= 2 || isEmoji(text);
    if(isEmojiOrLetter) {
      extraClasses.push('emoji')
    }

    if(text === '🤜') {
      text = _.shuffle(["👊", "🤛", "🤜"])[0]
    }

    if(text.length > 20) {
      return;
    }

    let reaction = {
      text, time: new Date().valueOf(),
      style: this.props.getUserPositionStyle(userId),
      extraClasses
    };

    if(userId && !isEmojiOrLetter) {
      reaction.style.background = Avatar.getUserColor(userId)
    }

    setTimeout(() => {
      this.setState({reactions: _.without(this.state.reactions, reaction)})
    }, 5000);

    this.setState({reactions: [...this.state.reactions, reaction]});
  }

  handleMsg({text, userId}) {
    // if (true || text === "piña") {
      this.addTextReaction(text, userId)


    // }
  }

  //
  render() {
    const {reactions} = this.state;

    if (reactions.length) {
      return <div className={'reactions'}>
        {reactions.map(({text, time, style, extraClasses}) => {
          return <span className={'reaction '+extraClasses.join(' ')} style={style} key={time}>{text}</span>;
        })}
      </div>
    } else {
      return null;
    }
  }
}
