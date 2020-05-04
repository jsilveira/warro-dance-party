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

const emojiPinia = "🤜";
const emojiHeart = "❤️";
const defaultEmoji = emojiHeart;

function removeDiacritics(str) {
  return unorm.nfd(str || "").replace(/[\u0300-\u036f]/g, "");
}

class SendMsgBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: '',
    };
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

        let sentEmojis = findEmojis(text);
        if(sentEmojis.length && sentEmojis[0] !== defaultEmoji) {
          this.setState({lastEmoji: sentEmojis[0]})
        }
      } else {
        this.sendMessage(defaultEmoji);
      }
    }
  }

  keyPressedHandler(keyEvent) {
    let autocomplete = this.state.autocomplete;
    let autocompleteNext = this.state.autocompleteNext;
    let autocompleteType = this.state.autocompleteType;

    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      if (!autocomplete || autocompleteType !== "user") {
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
    let dontTakeFocus = e => e.preventDefault();

    let lastEmoji = this.state.lastEmoji;

    return <div className="send-msg-bar">
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
                  onClick={() => this.sendMessage(defaultEmoji)}
                  onMouseDown={dontTakeFocus}>❤️
          </button>
        </div>
      </div>;
  }
}

export default SendMsgBar;
