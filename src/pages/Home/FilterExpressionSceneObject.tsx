import React from 'react';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { FilterInput } from '@grafana/ui';

export interface FilterExpressionSceneObjectState extends SceneObjectState {
  expression: string;
}

export class FilterExpressionSceneObject extends SceneObjectBase<FilterExpressionSceneObjectState> {
  static Component = CustomSceneObjectRenderer;

  onValueChange = (value: string) => {
    this.setState({ expression: value });
  };
}

function CustomSceneObjectRenderer({ model }: SceneComponentProps<FilterExpressionSceneObject>) {
  const state = model.useState();
  return (
    <>
      {state.expression && (
        <FilterInput
          value={state.expression}
          width={40}
          type="text"
          onChange={(v: string) => {
            model.onValueChange(v);
          }}
        />
      )}
    </>
  );
}
