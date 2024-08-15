import React from 'react';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Input } from '@grafana/ui';

export interface CustomSceneObjectState extends SceneObjectState {
  expression: string;
}

export class QueryExpressionSceneObject extends SceneObjectBase<CustomSceneObjectState> {
  static Component = CustomSceneObjectRenderer;

  onValueChange = (value: string) => {
    this.setState({ expression: value });
  };
}

function CustomSceneObjectRenderer({ model }: SceneComponentProps<QueryExpressionSceneObject>) {
  const state = model.useState();
  console.log("state.expression: ", state.expression);
  return (
    <Input
      value={state.expression}
      width={40}
      type="text"
      onBlur={(evt) => {
        model.onValueChange(evt.currentTarget.value);
      }}
    />
  );
}
