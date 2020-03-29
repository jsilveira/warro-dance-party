import React, {Component} from 'react';
import client from './feathers';
import _ from 'lodash';

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
    this.addTextReaction("hola 👋")
  }

  addTextReaction(text) {
    const extraClasses = [];

    if(text.length <= 2) {
      extraClasses.push('emoji')
    }

    if(text === '🤜') {
      text = _.shuffle(["👊", "🤛", "🤜"])[0]
    }

    let reaction = {
      text, time: new Date().valueOf(),
      style: {
        left: `${Math.random() * 50 + 25}%`,
        top: `${Math.random() * 50 + 25}%`,
      },
      extraClasses
    };

    setTimeout(() => {
      this.setState({reactions: _.without(this.state.reactions, reaction)})
    }, 5000);

    this.setState({reactions: [...this.state.reactions, reaction]});
  }

  handleMsg({text, userId}) {
    // if (true || text === "piña") {
      this.addTextReaction(text)
    // }
  }

  componentWillUnmount() {
    // Clean up listeners
    client.service('messages').removeListener('created', this.handleMsg);
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
