import _ from 'lodash';
import moment from 'moment';
import React, {Component} from 'react';

import client from './feathers';
import Reactions from './reactions';
import emojis from './emojis'

const name = (user) => user.email.split('@')[0]

class Chat extends Component {
  constructor(props) {
    super(props)
    this.state = {
      message: ''
    }
  }

  sendMessage(text) {
    if (text) {
      client.service('messages').create({text});
    } else {
      text = this.state.message.trim();

      if (text) {
        client.service('messages').create({text}).then(() => {
          this.setState({message: '', autocomplete: null})
        });
      } else {
        this.sendMessage("🤜");
      }
    }
  }

  scrollToBottom(newMsg) {
    const chat = this.chat;
    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
  }

  componentDidMount() {
    this.scrollToBottom = this.scrollToBottom.bind(this);

    client.service('messages').on('created', this.scrollToBottom);
    this.scrollToBottom();
  }

  componentWillUnmount() {
    // Clean up listeners
    client.service('messages').removeListener('created', this.scrollToBottom);
  }

  keyPressedHandler(keyEvent) {
    if (keyEvent.key === "Enter") {
      this.sendMessage()
    } else if (keyEvent.key === "Tab") {
      let autocomplete = this.state.autocomplete;
      let nextEmoji = this.state.nextEmoji;

      if (autocomplete && autocomplete.length) {
        let msg = this.state.message || "";

        let [, prefix] = msg.match(/:([\w_]+)$/) || [];

        if (prefix) {
          msg = msg.replace(/:[\w_]+$/, emojis[autocomplete[0]]);
        } else {
          msg = msg.replace(emojis[autocomplete[nextEmoji ? (nextEmoji-1) : autocomplete.length - 1]], emojis[autocomplete[nextEmoji]])
        }
        this.setState({nextEmoji: (nextEmoji + 1) % autocomplete.length, message: msg})
      }


      keyEvent.preventDefault();
    }
  }

  inputChange(text) {
    let [,prefix] = text.match(/:([\w_]+)$/) || [];

    if (prefix) {
      let exactEmojiMatch = emojis[prefix];
      if (exactEmojiMatch) {
        text = text.replace(/:([\w_]+)$/, exactEmojiMatch);
      }

      let emojiSearch = this.emojiCandidates(prefix);

      if (emojiSearch.length) {
        this.setState({autocomplete: emojiSearch, nextEmoji: (exactEmojiMatch && emojiSearch.length > 1) ? 1 : 0})
      } else {
        this.setState({autocomplete: null})
      }
    } else {
      this.setState({autocomplete: null})

    }

    this.setState({message: text})
  }

  emojiCandidates(prefix) {
    let emojiMatch = _.filter(_.keys(emojis), em => em.startsWith(prefix.toLowerCase()));

    if (emojiMatch.length < 20) {
      emojiMatch = emojiMatch.concat(_.filter(_.keys(emojis), em => em.indexOf(prefix.toLowerCase()) > 0))
    }
    return emojiMatch;
  }

  renderSuggestions() {
    const {autocomplete, nextEmoji} = this.state;
    if (autocomplete) {
      return <div className={'autocomplete bg-dark rounded p-1 shadow-sm ml-4 mr-4 mb-2'}>
        Press <span className={'key'}>TAB</span> for &nbsp;

        {
          _.map(autocomplete.slice(0, 15), (emojiName,i) => <span
            className={'emoji p-1 text-lg '+(nextEmoji == (i+1) ? 'bg-primary rounded' : '')}
            key={emojiName}
            title={emojiName}>
          {emojis[emojiName]}
        </span>)
        }
        {autocomplete.length > 15 ? <span className={'small'}>... and {autocomplete.length} more</span> : null}
      </div>
    } else {
      return null;
    }
  }

  render() {
    let {users, messages} = this.props;

    let dontTakeFocus = e => e.preventDefault();
    return <div className="dancefloor">

      <Reactions/>

      <div className="chat p-4" ref={main => this.chat = main}>
        <div  className="chat-window shadow-sm rounded bg-dark p-2">{this.renderMessages(messages)}</div>
      </div>

      {/*<footer className="d-flex flex-row flex-center">*/}
      {/*  <a href="#" onClick={() => client.logout()} className="btn btn-primary">*/}
      {/*    Sign Out*/}
      {/*  </a>*/}
      {/*</footer>*/}

      <div className="online-users">
        {/*<div className="">*/}
        {/*  <h4 className="font-300 text-center">*/}
        {/*    <span className="font-600 online-count">{users.length}</span> users*/}
        {/*  </h4>*/}
        {/*</div>*/}

        <div className={"d-flex justify-content-around mb-2 flex-wrap "+(users.length > 20 ? 'many-users' : '')}>
          {users.map((user,i) => <span key={user.id+i} className={'text-center'}>
              <span className="block relative">
                <div className={'avatar'}>
                  <img src={user.avatar} alt={user.email} className="shadow-sm"/>
                  <div className="avatar-name bg-dark shadow-sm">{name(user)}</div>
                </div>
              </span>
            </span>)}
        </div>

        { this.renderSuggestions() }
      </div>

      <div className="send-msg-bar">
        <div className="rounded d-flex flex-row flex-space-between p-2 bg-dark shadow-sm" id="send-message">
          <input autoFocus={true}
                 className={"d-flex flex1-1 form-control"}
                 value={this.state.message || ""}
                 placeholder={"Chat here... (use :NAME for Emojis ;)"}
                 onKeyDown={(e) => this.keyPressedHandler(e)}
                 onChange={e => this.inputChange(e.target.value)}
                 type="text"
          />
          <button className="btn btn-primary ml-2" onMouseDown={dontTakeFocus} onClick={() => this.sendMessage()}>
            Send
          </button>

          <button className="btn btn-secondary ml-2" onClick={() => this.sendMessage("🤜")}
                  onMouseDown={dontTakeFocus}>🤜
          </button>
        </div>
      </div>
    </div>;
  }

  renderMessages(messages) {
    let lastMessage = null;
    let res = [];
    _.each(messages, (msg, i) => {
      const userId = msg.user.id;
      const lastUserId = lastMessage && lastMessage.user.id;

      let msgBlock = null;

      const timeFromLastMsg = lastMessage ? moment(msg.createdAt).diff(lastMessage.createdAt) : 1000000;

      if (lastUserId === userId) {
        msgBlock = this.renderMessage(msg, true, timeFromLastMsg < 1000*60)
      } else {
        msgBlock = this.renderMessage(msg)
      }


      if(lastMessage && msgBlock) {
        if(timeFromLastMsg > 1000*60*5) {
          res.push(<div
            className={'text-center text-secondary small'}>after {moment(msg.createdAt).from(moment(lastMessage.createdAt), 'm')}</div>)
        }
      }

      if (msgBlock) {
        lastMessage = msg;
        res.push(msgBlock);
      }
    });

    if(lastMessage) {
      const timeFromLastMsg = moment(new Date()).diff(lastMessage.createdAt);
      if(timeFromLastMsg > 1000*60*5) {
        res.push(<div className={'text-center text-secondary small mt-1'}>Last message {moment(lastMessage.createdAt).fromNow()}</div>)
      }
    }

    if(!res.length) {
      res = <div className={'text-center p-2 text-secondary'}>No recent chat messages</div>
    }
    return res;
  }

  renderMessage(message, skipName = false, skipTime = false) {
    if (message.text.length > 2) {
      return <div key={message.id} className="message d-flex flex-row">
        <div className={'text-center mr-2 date-bar'}>
          {skipName ? null : <img src={message.user.avatar} alt={message.user.email} className="avatar"/>}

          <div className="sent-date small">
            {skipTime ? null : moment(message.createdAt).format('hh:mm')}
          </div>
        </div>

        <div className="message-wrapper">
          {skipName ? null : <div className="message-header">
            <span className="username">{name(message.user)}</span>
          </div>}

          <div className="message-content font-300">{message.text}</div>
        </div>
      </div>;
    } else {
      return null;
    }
  }
}

export default Chat;
