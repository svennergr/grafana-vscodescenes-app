import React, { useMemo } from 'react';

import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { getBasicScene } from './scenes';

const getScene = () => {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        url: prefixRoute(ROUTES.Home),
        getScene: () => {
          return getBasicScene();
        },
      } as any),
    ],
  });
};
export const HomePage = () => {
  const scene = useMemo(() => getScene(), []);
  // Hide header and move content up to simulate full screen
  const css = `
  header {
    display: none !important;
  }
  main {
    margin-top: -135px !important;
    zoom: 85%;
  }
  mark[class*="match-highlight"]:first-of-type {
    background-color: transparent !important;
    color: inherit !important;
  }
  button[title="Add filter"] {
    display: none !important;
  }`;
  return (
    <>
      <style>{css}</style>
      <scene.Component model={scene} />
    </>
  );
};
