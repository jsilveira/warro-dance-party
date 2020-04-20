import _ from 'lodash';
import unorm from 'unorm';
import moment from 'moment';
import React, {Component} from 'react';
import Linkify from 'react-linkify';

import client from './feathers';
import {findEmojis} from './../../server/src/emojis';
import Avatar from "./avatar";

const name = (user) => (user.email || "").split('@')[0]

const chatLinksComponent = (href, text, key) => (
  <a href={href} key={key} target="_blank">
    {text}
  </a>
);

function removeDiacritics(str) {
  return unorm.nfd(str || "").replace(/[\u0300-\u036f]/g, "");
}

class ChatConversation extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [],
      maxMessagesShown: 100,
      showAll: false
    };

    // This can be outside of state, so that changing it does not trigger a setState and render
    this.scrollInBottom = true;

    this.scrollToBottomWithDelay = (... args) => setTimeout(() => this.scrollToBottomOnMessage(... args), 5);
    this.onAuthenticated = this.onAuthenticated.bind(this);
    this.userUpdated = this.userUpdated.bind(this);
  }

  userUpdated(updatedUser) {
    // Change current user
    let user = this.state.user;
    if(user && user.id === updatedUser.id) {
      user = updatedUser;
    }

    // Update messages' users
    _.each(this.state.messages, msg => {
      if(msg.user.id === updatedUser.id) {
        msg.user = updatedUser;
      }
    });

    this.setState({ messages: this.state.messages, user})
  }


  async onAuthenticated({user}) {
    this.setState({user});

    client.service('users').on('updated', this.userUpdated);

    // Get all users and messages
    const messagePage = await client.service('messages').find({
        query: {
          $sort: { createdAt: -1 },
          $limit: 400
        }
      });

    // We want the latest messages but in the reversed order
    const messages = messagePage.data.reverse();

    // Once both return, update the state
    this.setState({ messages }, () => {
      this.scrollToBottom();
    });
  }

  scrollToBottom(newMsg) {
    const chat = this.chat;
    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
  }

  scrollToBottomOnMessage(message) {
    const {text, userId} = message;
    // Only autoscroll when the scroll is already on the bottom
      let allEmojis = findEmojis(text);

      if (allEmojis.length === 0 || allEmojis.join('') !== text) {
        let messages = (this.state.messages || []).concat(message);
        this.setState({messages});

        if(this.scrollInBottom) {
          this.scrollToBottom()
        }
    }
  }

  componentDidMount() {
    client.service('messages').on('created', this.scrollToBottomWithDelay);
    client.on("authenticated", this.onAuthenticated);
    this.scrollToBottom();
  }

  componentWillUnmount() {
    // Clean up listeners
    client.off("authenticated", this.onAuthenticated);
    client.service('messages').removeListener('created', this.scrollToBottomWithDelay);
    client.service('users').off('updated', this.userUpdated);
  }

  handleScroll(e) {
    const bottom = Math.abs(e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight) < 40;
    if (!bottom && this.scrollInBottom) {
      this.scrollInBottom = false;
    } else if(!this.scrollInBottom && bottom) {
      this.scrollInBottom = true;
    }
  }

  renderMessages(messages) {
    let lastMessage = null;

    let res = [];

    let maxMsgs = this.state.maxMessagesShown;

    if(messages.length > maxMsgs && !this.state.showAll) {
      res.push(<div key={'show-all'} className={'text-center pb-2'}>
        <span onClick={() => this.setState({showAll: true})} className={'btn btn-link'}>
          <i className={'material align-middle mr-1 material-icons'}>expand_less</i>
          Mostrar {messages.length - maxMsgs} mensajes anteriores
        </span>
      </div>)
    }

    _.each(messages.slice(-maxMsgs), (msg, i) => {
      const userId = msg.user.id;
      const lastUserId = lastMessage && lastMessage.user.id;

      let msgBlock = null;

      const timeFromLastMsg = lastMessage ? moment(msg.createdAt).diff(lastMessage.createdAt) : 1000000;

      if (lastUserId === userId) {
        msgBlock = this.renderMessage(msg, true, timeFromLastMsg < 1000*60*2)
      } else {
        msgBlock = this.renderMessage(msg)
      }


      if(lastMessage && msgBlock) {
        if(timeFromLastMsg > 1000*60*15) {
          res.push(<div key={'time'+msg.createdAt}
            className={'text-center text-time small mt-2 mb-1'}>after {moment(msg.createdAt).from(moment(lastMessage.createdAt), 'm')}</div>)
        }
      }

      if (msgBlock) {
        lastMessage = msg;
        res.push(msgBlock);
      }
    });

    if(lastMessage) {
      const timeFromLastMsg = moment(new Date()).diff(lastMessage.createdAt);
      if(timeFromLastMsg > 1000*60*15) {
        res.push(<div key={'last-msg'} className={'text-center text-time small mt-2'}>Last message {moment(lastMessage.createdAt).fromNow()}</div>)
      }
    }

    if(!res.length) {
      res = <div className={'text-center p-2 text-time'}>No recent chat messages</div>
    }
    return res;
  }

  mentionRegex() {
    if (!this.props.user) {
      return null;
    }
    const mentionName = removeDiacritics(name(this.props.user));
    return new RegExp(`(\\b|@)${_.escapeRegExp(mentionName)}\\b`, 'i');
  }

  mentionsMe(user, text) {
    const mentionRegex = this.mentionRegex();
    if (!mentionRegex) {
      return false;
    }
    if (user.id === this.props.user.id) {
      return false;
    }
    return mentionRegex.test(removeDiacritics(text));
  }

  addMentionSpan(user, text) {
    const mentionRegex = this.mentionRegex();
    if (!mentionRegex) {
      return text;
    }
    if (user.id === this.props.user.id) {
      return text;
    }
    const match = mentionRegex.exec(removeDiacritics(text));
    if (!match) {
      return text;
    }
    window.match = match;
    return (
      <span>
      <span>{text.substring(0, match.index)}</span>
      <span className="mention-span">{text.substring(match.index, match.index + match[0].length)}</span>
      <span>{text.substring(match.index + match[0].length)}</span>
      </span>
    );
  }

  renderMessage(message, sameUser = false, skipTime = false) {
    let isAllEmojis = findEmojis(message.text).join('') === message.text;

    let extraClasses = [];

    if(sameUser)
      extraClasses.push('message-continue', 'pt-0', 'pr-1');
    else
      extraClasses.push('p-0');

    if(this.props.user && message.user.id === this.props.user.id) {
      extraClasses.push('my-message')
    }

    if (message.text.length > 1 && !isAllEmojis) {
      return <div key={message.id} className={"message d-flex flex-row "+extraClasses.join(' ')}>

        <div className={'text-center mr-2 date-bar'}>
          {sameUser ? null : <Avatar user={message.user}/>}
        </div>

        <div>
          <div className={"message-wrapper" + (this.mentionsMe(message.user, message.text)? " mentions-me" : "")}>
            {sameUser ? null : <div className="message-header">
              <span className="username" style={{color: `${Avatar.getUserColor(message.user.id)}`}}>{name(message.user)}</span>
            </div>}

            <div className="message-content font-300">
              <Linkify componentDecorator={chatLinksComponent}>
                {this.addMentionSpan(message.user, message.text)}</Linkify>
            </div>

            <div className="sent-date">
              {moment(message.createdAt).format('hh:mm')}
            </div>
          </div>
        </div>
      </div>;
    } else {
      return null;
    }
  }

  render() {
    let {messages} = this.state;
    let start = new Date();

    let res = <div className="chat px-4 pt-2 pb-4" ref={main => this.chat = main} onScroll={this.handleScroll.bind(this)}>
        <div  className="chat-window">{this.renderMessages(messages)}</div>
      </div>;

    // console.log(`Chat conversation render in ${new Date() - start}`);
    return res;
  }
}

export default ChatConversation;
