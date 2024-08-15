import React from 'react';

import { ToolbarButton } from '@grafana/ui';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';

export interface LogsMetricsSwitchSceneState extends SceneObjectState {
  type: 'logs' | 'metrics' | 'prometheus';
}

export class LogsMetricsSwitchScene extends SceneObjectBase<LogsMetricsSwitchSceneState> {
  static Component = CustomSceneObjectRenderer;

  onValueChange = (value: 'logs' | 'metrics' | 'prometheus') => {
    this.setState({ type: value });
  };
}

function CustomSceneObjectRenderer({ model }: SceneComponentProps<LogsMetricsSwitchScene>) {
  const state = model.useState();

  const onClick = () => {
    if (state.type === 'logs') {
      model.onValueChange('metrics');
    } else {
      model.onValueChange('logs');
    }
  };

  return (
    <ToolbarButton
      variant="canvas"
      icon={state.type === 'logs' ? 'graph-bar' : 'gf-logs'}
      onClick={onClick}
    ></ToolbarButton>
  );
}
