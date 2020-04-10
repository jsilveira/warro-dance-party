import _ from 'lodash';
import moment from 'moment';
import React, {Component} from 'react';
import Linkify from 'react-linkify';

import client from './feathers';
import Reactions from './reactions';
import Player from './player';
import emojis from './emojis'
import {Avatar} from "./avatar";

const name = (user) => user.email.split('@')[0]

const chatLinksComponent = (href, text, key) => (
  <a href={href} key={key} target="_blank">
    {text}
  </a>
);

class Chat extends Component {
  constructor(props) {
    super(props)
    this.state = {
      message: '',
      logo: 'w'
    };

    this.scrollToBottomWithDelay = () => setTimeout(() => this.scrollToBottom(), 5);
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

  componentDidMount() {
    client.service('messages').on('created', this.scrollToBottomWithDelay);
    this.scrollToBottom();
  }

  componentWillUnmount() {
    // Clean up listeners
    client.service('messages').removeListener('created', this.scrollToBottomWithDelay);
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
      return <div className={'autocomplete rounded p-2 shadow-sm mb-2 mr-4'}>
        <div className={'small mb-2'}>Press <span className={'key'}>TAB</span> for:</div>
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

    // users = [... users, ... sampleUsers, ... _.map(sampleUsers, u => ({ ... u, id: u.id + '2'}))];
    // users = [... users, ... sampleUsers.slice(0,5)];

    let dontTakeFocus = e => e.preventDefault();

    let logoName = this.state.logo;

    return <div className="dancefloor">

      <Reactions/>

      <div className={'bg-side'}></div>

      <div className="chat px-4 pt-2 pb-4" ref={main => this.chat = main}>
        <div  className="chat-window">{this.renderMessages(messages)}</div>
      </div>

      {/*<footer className="d-flex flex-row flex-center">*/}
      {/*  <a href="#" onClick={() => client.logout()} className="btn btn-primary">*/}
      {/*    Sign Out*/}
      {/*  </a>*/}
      {/*</footer>*/}

      <div className="player-controls">
        <Player onMetadataUpdate={this.onMetadataUpdate.bind(this)}/>
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


      <div className={"online-users "+(users.length > 70 ? 'many-users' : '')}>
          {users.map((user,i) => <Avatar user={user} key={user.id} index={i} total={users.length} positionInCircle={true}/>) }
      </div>

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

          <button className="btn btn-sm btn-dark ml-2 p-0 shadow-sm"
                  style={{fontSize: '24px'}}
                  onClick={() => this.sendMessage("🤜")}
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

  renderMessage(message, sameUser = false, skipTime = false) {
    if (message.text.length > 2) {
      return <div key={message.id} className={"message d-flex flex-row "+(sameUser ? 'message-continue pt-0 pr-1' : 'p-0')}>

        <div className={'text-center mr-2 date-bar'}>
          {sameUser ? null : <Avatar user={message.user}/>}

          <div className="sent-date">
            {skipTime ? null : moment(message.createdAt).format('hh:mm')}
          </div>
        </div>

        <div>
          <div className="message-wrapper">
            {sameUser ? null : <div className="message-header">
              <span className="username" style={{color: `${Avatar.getUserColor(message.user.id)}`}}>{name(message.user)}</span>
            </div>}

            <div className="message-content font-300">
              <Linkify componentDecorator={chatLinksComponent}>
                {message.text}</Linkify>
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

var sampleUsers =  [
  {
    "email": "juan.cassinelli@gmail.com",
    "avatar": "https://s.gravatar.com/avatar/8b6d34e1a71df5d3ecb029038c1e8cc0?s=60&d=blank",
    "id": "d997a542-18fa-43e6-87f4-fc479fde70c3"
  },
  {
    "email": "chanodiba@gmail.com",
    "avatar": "https://s.gravatar.com/avatar/310035d2ddcbb883f45a49ef68ed531d?s=60&d=blank",
    "id": "c51c1a4e-ec2c-4865-9b4a-17098cf93153"
  },
  {
    "email": "sdgaleazzi@gmail.com",
    "avatar": "https://s.gravatar.com/avatar/98eef8457b08fe1bedb8f74bb60125ae?s=60&d=blank",
    "id": "ec26dcde-6d5b-4421-8b5a-9eabfe45ffa0"
  },
  {
    "email": "Edu Ghio",
    "avatar": "https://s.gravatar.com/avatar/5528be08541b6f0605cffb7cb13c0b10?s=60&d=blank",
    "id": "bfff6b97-dbc2-4855-9d4d-b2d1ab5d42a2"
  },
  {
    "email": "Agus",
    "avatar": "https://s.gravatar.com/avatar/fdf169558242ee051cca1479770ebac3?s=60&d=blank",
    "id": "872dc379-ebc2-46e0-b8e8-cff0890dfdd2"
  },
  {
    "email": "fernandagaitan@hotmail.com",
    "avatar": "https://s.gravatar.com/avatar/aad79fcdc2ecb195a3fbde186351f007?s=60&d=blank",
    "id": "afc26081-1972-41b4-86f8-8af875fae5dc"
  },
  {
    "email": "joacochipi@hotmail.com",
    "avatar": "https://s.gravatar.com/avatar/7675b117b7302065bf6499835fe8c59b?s=60&d=blank",
    "id": "5d360ac1-18db-4de0-82a2-cf42d9613f9a"
  },
  {
    "email": "Bianchu",
    "avatar": "https://s.gravatar.com/avatar/53b5ee96bdff56c811297549918204bf?s=60&d=blank",
    "id": "9da04b4f-fee0-4b7a-b4e8-1e99ab332703"
  },
  {
    "email": "lulivestuario@gmail.com",
    "avatar": "https://s.gravatar.com/avatar/fc634a0e2644f90d3610c0eda9b401a3?s=60&d=blank",
    "id": "005adc15-d02c-4850-a1e9-ba143d7b1e48"
  },
  {
    "email": "July",
    "avatar": "https://s.gravatar.com/avatar/3785a4f12840727f9fc71676c104ac0d?s=60&d=blank",
    "id": "0a82d054-219d-457f-9c3a-21554447318d"
  },
  {
    "email": "blu",
    "avatar": "https://s.gravatar.com/avatar/6f2fb2d3def4f99053edab239195f146?s=60&d=blank",
    "id": "58d6b913-92ff-44e3-8220-23563d50de6c"
  },
  {
    "email": "marian",
    "avatar": "https://s.gravatar.com/avatar/61de80355d479505de9c731f12460625?s=60&d=blank",
    "id": "3090f9ad-d5bf-4d21-bd71-bb2eeb145102"
  },
  {
    "email": "jorge.dodds@gmail.com",
    "avatar": "https://s.gravatar.com/avatar/d20a179c760de310d321fd35878c90d0?s=60&d=blank",
    "id": "a6ece746-9a19-4bfc-82a7-807df2a2da5a"
  },
  {
    "email": "peluchin",
    "avatar": "https://s.gravatar.com/avatar/0c8977df8899a1c4b28c451f517be567?s=60&d=blank",
    "id": "7cd53a01-14f4-4b2d-9f6e-65c43ee05677"
  },
  {
    "email": "eduardo",
    "avatar": "https://s.gravatar.com/avatar/6d6354ece40846bf7fca65dfabd5d9d4?s=60&d=blank",
    "id": "4c9e468b-7808-4f93-ba5d-af75aa5e4c56"
  },
  {
    "email": "fannyunzola@gmail.com",
    "avatar": "https://s.gravatar.com/avatar/24f8eac7d69c1cf6ee40d840437c4ea6?s=60&d=blank",
    "id": "dd5182db-6477-4c2b-b0f2-0b8a6386317d"
  },
  {
    "email": "gonzaloar.gr@gmail.com",
    "avatar": "https://s.gravatar.com/avatar/196b1d9440a92a127094343596ddfdf6?s=60&d=blank",
    "id": "85a37e5e-497e-4822-a994-9b30c094e31e"
  },
  {
    "email": "el capitano",
    "avatar": "https://s.gravatar.com/avatar/ab37c81186c678c17fdb841ab3c0ca1d?s=60&d=blank",
    "id": "554a7f43-de91-49a4-a0be-844a8aaa32f2"
  },
  {
    "email": "choique",
    "avatar": "https://s.gravatar.com/avatar/9058057222f97aeb4146012eed6a806d?s=60&d=blank",
    "id": "142fa85a-f570-427e-b1b4-be17b0f85200"
  },
  {
    "email": "dimemime@live.com.ar",
    "avatar": "https://s.gravatar.com/avatar/10a1cf7d541281bba5cf27eeea49f5b6?s=60&d=blank",
    "id": "4e775d7d-b1a0-4367-8979-7a64f6c05392"
  },
  {
    "email": "gustavogonzalezberbotto@hotmail.com",
    "avatar": "https://s.gravatar.com/avatar/b7bc0f998b6f91ee04fd6ab2f1f11b9f?s=60&d=blank",
    "id": "aaa171af-715c-44a4-9b70-1b796d8751e1"
  },
  {
    "email": "jsilveira@gmail.com",
    "avatar": "https://s.gravatar.com/avatar/b407621dc3482f7399bf251a6fb7e7a1?s=60&d=blank",
    "id": "27fa3432-12e3-4af6-a622-5d04b69335d7"
  }
]