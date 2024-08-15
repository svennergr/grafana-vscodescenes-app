import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { HomePage } from '../../pages/Home';
import { prefixRoute } from '../../utils/utils.routing';

export const Routes = () => {
  return (
    <Switch>
      <Route path={prefixRoute(`${ROUTES.Home}`)} component={HomePage} />
      <Redirect to={prefixRoute(ROUTES.Home)} />
    </Switch>
  );
};
