import React from 'react';

import { ToolbarButton } from '@grafana/ui';
import { SceneObjectBase } from '@grafana/scenes';

export class GoToExploreScene extends SceneObjectBase {
  static Component = CustomSceneObjectRenderer;
}

function CustomSceneObjectRenderer() {
  const onClick = () => {
    window.parent.postMessage(
      {
        type: 'openLink',
        link: 'http://localhost:3000/a/grafana-lokiexplore-app/explore/service/loki-loki/logs?patterns=%5B%5D&var-fields=&var-ds=bdu075to4btvke&var-patterns=&var-lineFilter=&var-logsFormat=%20%7C%20logfmt&var-filters=service_name%7C%3D%7Cloki%2Fquerier&urlColumns=%5B%5D&visualizationType=%22logs%22&from=now-5m&to=now',
      },
      '*'
    );
  };

  return <ToolbarButton variant="canvas" icon={'compass'} onClick={onClick}></ToolbarButton>;
}
