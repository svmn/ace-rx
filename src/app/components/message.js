'use strict';

import React, { Component, PropTypes } from 'react';
import forEach from 'lodash/forEach';
import classnames from 'classnames';
import { padTime } from '../utils';
import Avatar from './avatar';
import {
  LINK_REGEXP,
  REPLY_REGEXP,
  MARKUP_STRONG_REGEXP,
  MARKUP_EMPH_REGEXP,
  MARKUP_STRIKE_REGEXP,
  MARKUP_SPOILER_REGEXP
} from '../constants';

class Message extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      expandedText: false,
      showReadMore: false
    };
  }

  componentDidMount() {
    this.attachReplyHandler();
    if (this.messageTextRef.scrollHeight > this.messageTextRef.clientHeight) {
      this.setState({
        showReadMore: true
      });
    }
  }

  componentWillUnmount() {
    this.detachReplyHandler();
  }

  attachReplyHandler() {
    const replyElements = this.messageTextRef.querySelectorAll('a[data-reply]');
    // replyElements is Nodelist
    forEach(replyElements, el => el.addEventListener('click', (e) => this.replyHandler(e)));
  }

  detachReplyHandler() {
    const replyElements = this.messageTextRef.querySelectorAll('a[data-reply]');
    forEach(replyElements, el => el.removeEventListener('click', (e) => this.replyHandler(e)));
  }

  replyHandler(e) {
    e.preventDefault();
    this.props.gotoMessage(e.target.dataset.reply);
  }

  toggleExpand() {
    this.setState({ expanded: !this.state.expanded });
  }

  toggleExpandText(e) {
    e.preventDefault();
    this.setState({
      expandedText: !this.state.expandedText
    });
  }

  parseMarkup() {
    this.messageText = this.messageText
      .replace(MARKUP_STRONG_REGEXP, '<span class="strong">$1</span>')
      .replace(MARKUP_EMPH_REGEXP, '<span class="emph">$1</span>')
      .replace(MARKUP_STRIKE_REGEXP, '<span class="strike">$1</span>')
      .replace(MARKUP_SPOILER_REGEXP, '<span class="spoiler">$1</span>');
  }

  parseReplies() {
    this.messageText = this.messageText.replace(REPLY_REGEXP, '<a href="" data-reply="$1">$&</a>');
  }

  parseLinks() {
    this.messageText = this.messageText.replace(LINK_REGEXP, '<a href="$&" target="_blank">$&</a>');
  }

  /**
    Message processing flow:
    attach picture
    parse Youtube
    parse webm
    truncate
    parse markup
    parse replies
    parse links
    attach event handlers to replies
  */
  render() {
    const { message } = this.props;
    const { picture } = message;
    this.messageText = message.text;
    const time = new Date(message.time);
    const formattedTime = `${padTime(time.getHours())}:${padTime(time.getMinutes())}:${padTime(time.getSeconds())}`;

    let attachment = null;

    if (picture) {
      attachment = (
        <div className='attachment'>
          <img
            src={`https://tuzach.in/${this.state.expanded ? picture.imgurl : picture.thumburl}`}
            alt={message.id}
            style={{
              height: this.state.expanded ? null : `${picture.thumbh}px`,
              width: this.state.expanded ? null : `${picture.thumbw}px`
            }}
            onTouchTap={() => this.toggleExpand()}
          />
        </div>
      );
    }

    this.parseMarkup();
    this.parseReplies();
    this.parseLinks();

    return (
      <div className={classnames('message', { selected: this.props.selected })} ref={ref => (this.ref = ref)}>
        <div className='avatar' onTouchTap={() => this.props.reply(message.id)}>
          <Avatar userId={message.user_id} />
        </div>
        <div className='time'>{formattedTime}</div>
        <div className='id'>
          <span onTouchTap={() => this.props.reply(message.id)}>#{message.id}</span>
        </div>
        <div
          className='text'
          ref={ref => (this.messageTextRef = ref)}
          style={{
            maxHeight: this.state.expandedText ? 'none' : null
          }}
          dangerouslySetInnerHTML={{ __html: this.messageText }}
        />
        {
          this.state.showReadMore ?
            <a href='' className='read-more' onClick={e => this.toggleExpandText(e)} >
              {
                this.state.expandedText ? 'Скрыть' : 'Читать полностью'
              }
            </a> :
            null
        }
        {attachment}
      </div>
    );
  }
}

Message.propTypes = {
  message: PropTypes.object.isRequired,
  reply: PropTypes.func.isRequired,
  gotoMessage: PropTypes.func.isRequired,
  selected: PropTypes.bool
};

export default Message;