import _ from 'lodash';
import unorm from 'unorm';
import moment from 'moment';
import React, {Component} from 'react';
import Linkify from 'react-linkify';

import client from './feathers';
import Player from './player';
import {emojis, findEmojis} from './../../server/src/emojis';
import Avatar from "./avatar";
import OnlineUsersWithReactions from "./OnlineUsersWithReactions";

const name = (user) => (user.email || "").split('@')[0]

const chatLinksComponent = (href, text, key) => (
  <a href={href} key={key} target="_blank">
    {text}
  </a>
);

const emojiPinia = "🤜";

function removeDiacritics(str) {
  return unorm.nfd(str || "").replace(/[\u0300-\u036f]/g, "");
}

class Chat extends Component {
  constructor(props) {
    super(props)
    this.state = {
      message: '',
      logo: 'w',
      scrollInBottom: true
    };

    this.scrollToBottomWithDelay = (... args) => setTimeout(() => this.scrollToBottomOnMessage(... args), 5);
    this.onAuthenticated = this.onAuthenticated.bind(this);
  }

  onAuthenticated({user}) { this.setState({user}); }

  sendMessage(text) {
    if (text) {
      client.service('messages').create({text});
    } else {
      text = this.state.message.trim();

      if (text) {
        client.service('messages').create({text}).then(() => {
          this.setState({message: '', autocomplete: null})
        });

        let sentEmojis = findEmojis(text);
        if(sentEmojis.length && sentEmojis[0] !== emojiPinia) {
          this.setState({lastEmoji: sentEmojis[0]})
        }
      } else {
        this.sendMessage(emojiPinia);
      }
    }
  }

  onMetadataUpdate(metadata) {
    let logo = 'w';
    if (metadata.live && (metadata.live.streamer_name || '').match(/joya/i)) {
      logo = 'joya';
    }

    if (this.state.logo !== logo) {
      this.setState({logo})
    }
  }

  scrollToBottom(newMsg) {
    const chat = this.chat;
    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
  }

  scrollToBottomOnMessage({text, userId}) {
    // Only autoscroll when the scroll is already on the bottom
    if(this.state.scrollInBottom) {
      let allEmojis = findEmojis(text);

      if (allEmojis.length === 0 || allEmojis.join('') !== text) {
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
    client.service('messages').removeListener('created', this.scrollToBottomWithDelay);
    client.off("authenticated", this.onAuthenticated);
  }

  keyPressedHandler(keyEvent) {
    let autocomplete = this.state.autocomplete;
    let autocompleteNext = this.state.autocompleteNext;
    let autocompleteType = this.state.autocompleteType;
    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      if (autocompleteType !== "user") {
        this.sendMessage();
      }
      if (autocomplete && autocomplete.length && autocompleteType === "user") {
        const selected = autocompleteNext > 0
                             ? (autocompleteNext - 1) % autocomplete.length
                             : autocomplete.length - 1;
        let msg = this.state.message || "";
        let [, prefix] = msg.match(/@([^@]+)$/) || [];
        if (prefix) {
          msg = msg.replace(/@([^@]+)$/, "@" + name(autocomplete[selected]) + " ");
          this.setState({
            message: msg,
            autocompleteType : null,
            autocomplete : null,
          });
        }
      }
    } else if (keyEvent.key === "Tab") {

      if (autocomplete && autocomplete.length) {
        let msg = this.state.message || "";

        let [, prefix] = msg.match(/:([\w_]+)$/) || [];

        if (prefix) {
          msg = msg.replace(/:[\w_]+$/, emojis[autocomplete[0]]);
        } else {
          msg = msg.replace(
              emojis[autocomplete[autocompleteNext ? (autocompleteNext - 1)
                                                   : autocomplete.length - 1]],
              emojis[autocomplete[autocompleteNext]])
        }
        this.setState({
          autocompleteNext : (autocompleteNext + 1) % autocomplete.length,
          message : msg
        })
      }


      keyEvent.preventDefault();
    }
  }

  inputChange(text) {
    let [,type,prefix] = text.match(/([:@])([\w_]+)$/) || [];

    if (type === ":" && prefix) {
      // Emoji search.
      let exactEmojiMatch = emojis[prefix];
      if (exactEmojiMatch) {
        text = text.replace(/:([\w_]+)$/, exactEmojiMatch);
      }

      let emojiSearch = this.emojiCandidates(prefix);

      if (emojiSearch.length) {
        this.setState({
          autocompleteType : "emoji",
          autocomplete : emojiSearch,
          autocompleteNext : (exactEmojiMatch && emojiSearch.length > 1) ? 1 : 0
        })
      } else {
        this.setState({autocomplete: null})
      }
    } else if (type === "@" && prefix) {
      // User search.
      let users = this.props.users;

      let userSearch = _.filter(
          users, user => removeDiacritics(name(user))
                             .toLowerCase()
                             .includes(removeDiacritics(prefix).toLowerCase()));
      userSearch = _.sortBy(userSearch, user => name(user).length);
      userSearch = _.sortBy(
          userSearch,
          user => !removeDiacritics(name(user))
                       .toLowerCase()
                       .startsWith(removeDiacritics(prefix).toLowerCase()));

      if (userSearch.length) {
        this.setState({
          autocompleteType : "user",
          autocomplete : userSearch,
          autocompleteNext : (userSearch.length > 0) ? 1 : 0
        })
      } else {
        this.setState({autocomplete : null})
      }
    } else {
      this.setState({autocomplete : null})
    }

    this.setState({message: text})
  }

  handleScroll(e) {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (!bottom && this.state.scrollInBottom) {
      this.setState({scrollInBottom: false})
    } else if(!this.state.scrollInBottom) {
      this.setState({scrollInBottom: true})
    }
  }

  emojiCandidates(prefix) {
    let emojiMatch = _.filter(_.keys(emojis), em => em.startsWith(prefix.toLowerCase()));

    if (emojiMatch.length < 20) {
      emojiMatch = emojiMatch.concat(_.filter(_.keys(emojis), em => em.indexOf(prefix.toLowerCase()) > 0))
    }
    return emojiMatch;
  }

  selectEmoji(emoji) {
    let msg = this.state.message;
    let [, prefix] = msg.match(/:([\w_]+)$/) || [];

    if (prefix) {
      msg = msg.replace(/:[\w_]+$/, emoji);
    } else {
      let emojis = findEmojis(msg);
      if(emojis.length) {
        msg = msg.replace(new RegExp(emojis[emojis.length-1]+"$"), emoji);
      }
    }
    this.setState({message: msg})
  }

  selectUser(user) {
    let msg = this.state.message;
    let [, prefix] = msg.match(/@([^@]+)$/) || [];

    if (prefix) {
      msg = msg.replace(/@[^@]+$/, "@" + name(user) + " ");
    }
    this.setState({message : msg})
  }

  renderSuggestions() {
    const {autocompleteType, autocomplete, autocompleteNext} = this.state;
    if (autocomplete) {
      if (autocompleteType === "emoji") {
        return <div className={'autocomplete rounded p-2 shadow-sm mb-2 mr-4'}>
          <div className={'small mb-2'}>Press <span className={'key'}>TAB</span> for:</div>
          {
            _.map(autocomplete.slice(0, 15), (emojiName,i) => <span
              className={'emoji p-1 text-lg '+(autocompleteNext == (i+1) ? 'bg-primary rounded' : '')}
              key={emojiName}
              onClick={(() => this.selectEmoji(emojis[emojiName]))}
              title={emojiName}>
            {emojis[emojiName]}
          </span>)
          }
          {autocomplete.length > 15 ? <span className={'small'}>... and {autocomplete.length} more</span> : null}
        </div>
      } else if (autocompleteType === "user") {
        return <div className={'autocomplete rounded p-2 shadow-sm mb-2 mr-4'}>
          <div className={'small mb-2'}>Press <span className={'key'}>TAB</span> for:</div>
          {
            _.map(autocomplete.slice(0, 15), (user, i) => <span
              style={{color: Avatar.getUserColor(user.id)}}
              className={'p-1 user-mention ' + (autocompleteNext == (i + 1) % autocomplete.length ? 'bg-primary rounded' : '')}
              key={user.id}
              onClick={(() => this.selectUser(user))}
              title={user.email}>
            {name(user)}
          </span>)
          }
          {autocomplete.length > 15 ? <span className={'small'}>... and {autocomplete.length} more</span> : null}
        </div>
      }
    } else {
      return null;
    }
  }

  render() {
    let {users, messages} = this.props;

    // users = [... users, ... sampleUsers, ... _.map(sampleUsers, u => ({ ... u, id: u.id + '2'}))];
    // users = [... users, ... sampleUsers.slice(0,5)];

    let dontTakeFocus = e => e.preventDefault();

    let logoName = this.state.logo;

    let lastEmoji = this.state.lastEmoji;
    return <div className="dancefloor">
      <div className="chat px-4 pt-2 pb-4" ref={main => this.chat = main} onScroll={this.handleScroll.bind(this)}>
        <div  className="chat-window">{this.renderMessages(messages)}</div>
      </div>

      {/*<footer className="d-flex flex-row flex-center">*/}
      {/*  <a href="#" onClick={() => client.logout()} className="btn btn-primary">*/}
      {/*    Sign Out*/}
      {/*  </a>*/}
      {/*</footer>*/}

      <div className="player-controls">
        <Player onMetadataUpdate={this.onMetadataUpdate.bind(this)} user={this.props.user}/>
      </div>

      {this.props.connected ?
        <div className="logo-container">
          <div className={`logo ${logoName} clone`}></div>
          <div className={`logo ${logoName}`}></div>
        </div>
        : <div className="logo-container">
          <div className={'connecting text-white'}>Conectando...</div>
        </div>
      }

      <OnlineUsersWithReactions users={users}/>

      <div className="send-msg-bar">
          { this.renderSuggestions() }
        <div className="rounded d-flex flex-row flex-space-between" id="send-message">
          <input autoFocus={true}
                 className={"d-flex flex1-1 form-control shadow-sm"}
                 value={this.state.message || ""}
                 placeholder={"Escribí acá...   (poné :NOMBRE para emoji)"}
                 onKeyDown={(e) => this.keyPressedHandler(e)}
                 onChange={e => this.inputChange(e.target.value)}
                 type="text"
          />
          {/*<button className="btn btn-primary ml-2" onMouseDown={dontTakeFocus} onClick={() => this.sendMessage()}>*/}
          {/*  Send*/}
          {/*</button>*/}

          {
            lastEmoji ?
              <button className="btn btn-sm btn-dark ml-2 p-0 shadow-sm"
                      style={{fontSize: '24px'}}
                      onClick={() => this.sendMessage(lastEmoji)}
                      onMouseDown={dontTakeFocus}>{lastEmoji}
              </button> : null
          }

          <button className="btn btn-sm btn-dark ml-2 p-0 shadow-sm"
                  style={{fontSize: '24px'}}
                  onClick={() => this.sendMessage(emojiPinia)}
                  onMouseDown={dontTakeFocus}>👊
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
        msgBlock = this.renderMessage(msg, true, timeFromLastMsg < 1000*60*2)
      } else {
        msgBlock = this.renderMessage(msg)
      }


      if(lastMessage && msgBlock) {
        if(timeFromLastMsg > 1000*60*15) {
          res.push(<div key={i}
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
}

export default Chat;
