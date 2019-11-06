import * as React from 'react';
import styled from 'styled-components';
import {
  Controller,
  Model,
  TopicDirection,
  KeyType,
  TopicVisualLevel
} from '@blink-mind/core';
import { BaseProps } from '../../../components/BaseProps';
import debug from 'debug';
import { ThemeType } from '@blink-mind/core/src/configs/theme';
import { BaseWidget } from '../../../components/common';
import { FocusMode } from '@blink-mind/core/src/types';
import { OpType } from '../../operation';
import { collapseRefKey, contentRefKey } from '../../../utils';

const log = debug('node:topic-content-widget');

function getTopicTheme(visualLevel: number, theme: ThemeType) {
  if (visualLevel === TopicVisualLevel.ROOT) return theme.rootTopic;
  if (visualLevel === TopicVisualLevel.PRIMARY) return theme.primaryTopic;
  return theme.normalTopic;
}

const DropArea = styled.div`
  height: 20px;
  width: 100%;
`;

interface TopicContentProps {
  dragEnter?: boolean;
}

const TopicContent = styled.div<TopicContentProps>`
  display: flex;
  align-items: center;
  word-wrap: break-word;
  white-space: pre-line;
  cursor: pointer;
  overflow: hidden;
`;

const TopicContentWithDropArea = styled.div`
  position: relative;
`;

interface Props extends BaseProps {
  draggable: boolean;
}

interface State {
  dragEnter: boolean;
  showPopMenu: boolean;
}

let dragSrcItemKey: KeyType = null;

export class TopicContentWidget extends BaseWidget<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      dragEnter: false,
      showPopMenu: false
    };
  }

  onDragStart = e => {
    log('onDragStart');
    dragSrcItemKey = this.props.topicKey;
    e.stopPropagation();
  };

  onDragOver = e => {
    e.preventDefault();
  };

  onDragEnter = e => {};

  onDragLeave = e => {};

  onDrop = e => {
    log('onDrop');
  };

  isDoubleClick: boolean;

  onClick = e => {
    this.isDoubleClick = false;
    log(e.nativeEvent);
    const { controller } = this.props;
    setTimeout(() => {
      if (!this.isDoubleClick) {
        controller.run('handleTopicClick', this.props);
      }
    });
  };

  onDoubleClick = () => {
    this.isDoubleClick = true;
    const { controller } = this.props;
    controller.run('handleTopicDoubleClick', this.props);
  };

  onContextMenu = e => {
    const { controller } = this.props;
    controller.run('handleTopicContextMenu', this.props);
    this.setState({
      showPopMenu: true
    });
  };

  handlePopMenuVisibleChange = visible => {
    this.setState({
      showPopMenu: visible
    });
  };

  needRelocation: boolean = false;
  oldCollapseIconRect: ClientRect;

  componentDidUpdate() {
    if (this.needRelocation) {
      const { getRef, topicKey, setViewBoxScrollDelta } = this.props;
      const newRect = getRef(collapseRefKey(topicKey)).getBoundingClientRect();
      log('newRect:', newRect);
      log('oldRect:', this.oldCollapseIconRect);
      setViewBoxScrollDelta(
        newRect.left - this.oldCollapseIconRect.left,
        newRect.top - this.oldCollapseIconRect.top
      );
      this.needRelocation = false;
    }
  }

  onClickCollapse = e => {
    e.stopPropagation();
    const { topicKey, getRef } = this.props;
    this.needRelocation = true;
    this.oldCollapseIconRect = getRef(
      collapseRefKey(topicKey)
    ).getBoundingClientRect();
    this.operation(OpType.TOGGLE_COLLAPSE, this.props);
  };

  render() {
    const props = this.props;
    const { draggable, saveRef, topicKey, controller, topicStyle, dir } = props;
    const showPopMenu = this.state.showPopMenu;
    const collapseIcon = controller.run('renderTopicCollapseIcon', {
      ...props,
      onClickCollapse: this.onClickCollapse.bind(this)
    });
    log(dir);
    return (
      <TopicContentWithDropArea>
        <DropArea />
        <TopicContent
          // theme={getTopicTheme(visualLevel, model.config.theme)}
          // dragEnter={this.state.dragEnter}
          style={topicStyle}
          draggable={draggable}
          ref={saveRef(contentRefKey(topicKey))}
          onDragStart={this.onDragStart}
          onDragEnter={this.onDragEnter}
          onDragLeave={this.onDragLeave}
          onDragOver={this.onDragOver}
          onDrop={this.onDrop}
          onClick={this.onClick}
          onDoubleClick={this.onDoubleClick}
          onContextMenu={this.onContextMenu}
        >
          {controller.run('renderBlocks', props)}
          {showPopMenu &&
            controller.run('renderTopicPopupMenu', {
              ...props,
              handleVisibleChange: this.handlePopMenuVisibleChange,
              visible: true
            })}
        </TopicContent>
        <DropArea />
        {dir !== TopicDirection.MAIN && collapseIcon}
      </TopicContentWithDropArea>
    );
  }
}