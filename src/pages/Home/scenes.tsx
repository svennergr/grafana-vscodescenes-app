import {
  AdHocFiltersVariable,
  DataSourceVariable,
  EmbeddedScene,
  PanelBuilders,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { QueryExpressionSceneObject } from './QueryExpressionSceneObject';
import { LabelConfig, LabelConfigType } from 'utils/LabelConfig';
import { buildQueryExpression } from 'utils/query';
import { VariableHide } from '@grafana/schema';
import { FilterExpressionSceneObject } from './FilterExpressionSceneObject';
import { GoToExploreScene } from './GoToExploreButton';
import { LogsMetricsSwitchScene } from './LogsMetricsSwitchScene';
import { LOKI_DEV_UID, PROMETHEUS_DEV_UID } from '../../constants';

export function getBasicScene() {
  let scene: EmbeddedScene;
  const timeRange = new SceneTimeRange({
    from: 'now-5m',
    to: 'now',
  });

  const logsBody = new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: PanelBuilders.logs().setHoverHeader(true).setOption('showTime', true).build(),
      }),
    ],
  });
  const metricsBody = new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: PanelBuilders.timeseries().build(),
      }),
    ],
  });
  let body = logsBody;
  const typeSwitcher = new LogsMetricsSwitchScene({ type: 'logs' });

  const datasourceVariable = new DataSourceVariable({
    name: 'ds',
    label: 'Data source',
    pluginId: 'loki',
    value: LOKI_DEV_UID, // this is the loki dev uid
    hide: VariableHide.hideVariable,
  });

  const DATASOURCE_REF = {
    uid: '${ds}',
  };

  let baseExpression = `{app="grafana"}`;

  // Query runner definition, using Grafana built-in TestData datasource
  const queryRunner = new SceneQueryRunner({
    datasource: DATASOURCE_REF,
    queries: [
      {
        refId: 'A',
        expr: baseExpression,
        maxLines: 10,
      },
    ],
  });

  // Custom object definition
  const queryObject = new QueryExpressionSceneObject({
    expression: baseExpression,
  });
  // Custom object definition
  const filterObject = new FilterExpressionSceneObject({
    expression: '',
  });

  const variableSet = new SceneVariableSet({ variables: [datasourceVariable] });
  let currentLabels: LabelConfig[] = [];
  let filterExpression = '';
  let currentType: 'logs' | 'metrics' | 'prometheus' = 'logs';
  let metricBreakout = '';

  window.addEventListener('message', (event) => {
    if (event.data.type === 'setLabels') {
      datasourceVariable.setState({ value: LOKI_DEV_UID });
      filterObject.setState({ expression: '' });
      metricBreakout = '';
      const { labels, meta } = event.data.data;
      const labelsToApply = labels.map((label: any) => {
        return new LabelConfig(label);
      });
      const replacer = (v: string) => {
        const varRegex = /\${(.*?)}/g;
        const matches = v.match(varRegex);
        if (matches) {
          for (let match of matches) {
            const [varName, operation] = match.substring(2, match.length - 1).split(':');
            if (meta[varName]) {
              let newValue = meta[varName];
              if (operation) {
                // eslint-disable-next-line no-eval
                newValue = eval(`"${meta[varName]}".${operation}`);
              }
              v = v.replace(match, newValue);
            }
          }
        }
        return v;
      };
      currentLabels = labelsToApply;
      baseExpression = buildQueryExpression(labelsToApply, replacer);
      updateQueryObjectState(currentType, queryObject, baseExpression, filterExpression, metricBreakout);

      const varsToAdd = [];
      for (let label of labelsToApply) {
        if (label.type === LabelConfigType.OneOf) {
          const variable = new AdHocFiltersVariable({
            name: label.label,
            layout: 'vertical',
            label: label.label,
            filters: [{ key: label.label, operator: label.operator, value: label.value ?? label.values[0] }],
            hide: VariableHide.hideLabel,
            key: label.label,
            getTagValuesProvider: () =>
              Promise.resolve({ replace: true, values: label.values.map((l: string) => ({ text: l, value: l })) }),
          });
          variable.subscribeToState((newState) => {
            const filters = newState.filters;
            const filter = filters[0];
            const newLabels = currentLabels.map((l: LabelConfig) => {
              if (l.label === label.label) {
                return { ...l, value: filter.value };
              }
              return l;
            });
            window.parent.postMessage({ type: 'setLabels', data: { labels: newLabels, meta } }, '*');
          });
          varsToAdd.push(variable);
        }
      }
      variableSet.setState({ variables: [datasourceVariable, ...varsToAdd] });
    }

    if (event.data.type === 'setLineFilter') {
      datasourceVariable.setState({ value: LOKI_DEV_UID });
      metricBreakout = '';
      filterObject.setState({ expression: event.data.data.text });
      typeSwitcher.setState({ type: 'logs' });
    }

    if (event.data.type === 'setMetricBreakout') {
      metricBreakout = event.data.data.text;
      typeSwitcher.setState({ type: event.data.data.type });
      if (event.data.data.type === 'prometheus') {
        datasourceVariable.setState({ value: PROMETHEUS_DEV_UID });
      } else {
        datasourceVariable.setState({ value: LOKI_DEV_UID });
      }
    }
  });

  // Query runner activation handler that will update query runner state when custom object state changes
  queryRunner.addActivationHandler(() => {
    const sub = queryObject.subscribeToState((newState) => {
      queryRunner.setState({
        queries: [
          {
            ...queryRunner.state.queries[0],
            expr: newState.expression,
          },
        ],
      });
      queryRunner.runQueries();
    });

    const sub2 = filterObject.subscribeToState((newState) => {
      filterExpression = newState.expression;
      updateQueryObjectState(currentType, queryObject, baseExpression, filterExpression, metricBreakout);
    });

    const sub3 = typeSwitcher.subscribeToState((newState) => {
      if (newState.type === 'logs') {
        datasourceVariable.setState({ value: LOKI_DEV_UID });
        metricBreakout = '';
        body = logsBody;
      } else {
        body = metricsBody;
      }
      currentType = newState.type;
      updateQueryObjectState(newState.type, queryObject, baseExpression, filterExpression, metricBreakout);
      scene.setState({ body });
    });

    return () => {
      sub.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();
    };
  });

  scene = new EmbeddedScene({
    $timeRange: timeRange,
    $variables: variableSet,
    $data: queryRunner,
    body,
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      filterObject,
      new SceneTimePicker({ isOnCanvas: true }),
      new GoToExploreScene({}),
      typeSwitcher,
    ],
  });
  return scene;
}

function updateQueryObjectState(
  type: 'logs' | 'metrics' | 'prometheus',
  queryObject: QueryExpressionSceneObject,
  baseExpression: string,
  filterExpression: string,
  metricBreakout = ''
) {
  let expression = '';
  if (filterExpression === '') {
    expression = baseExpression;
  } else {
    expression = `${baseExpression} |= \`${filterExpression}\``;
  }

  if (type === 'logs') {
    queryObject.setState({ expression: expression });
  } else if (type === 'metrics') {
    let aggBy = 'detected_level';
    let agg1 = 'count_over_time';
    let agg2 = `sum by (${aggBy})(`;
    let helper = '';
    let end = ')';
    if (metricBreakout) {
      aggBy = metricBreakout;
      agg2 = `sum by (${aggBy})(`;
      helper = `|= \`${metricBreakout}\` | logfmt | json | drop __error__, __error_details__ `;
      if (['duration', 'time'].some((i) => metricBreakout.includes(i))) {
        agg1 = 'avg_over_time';
        agg2 = '';
        end = 'by ()';
        helper = `|= \`${metricBreakout}\` | logfmt | json | drop __error__, __error_details__ | unwrap duration(${metricBreakout})`;
      }
      if (['bytes', 'size'].some((i) => metricBreakout.includes(i))) {
        agg1 = 'avg_over_time';
        agg2 = '';
        end = 'by ()';
        helper = `|= \`${metricBreakout}\` | logfmt | json | drop __error__, __error_details__ | unwrap ${metricBreakout}`;
      }
    }
    queryObject.setState({
      expression: `${agg2}${agg1}(${expression} ${helper} [$__auto])${end}`,
    });
  } else if (type === 'prometheus') {
    queryObject.setState({
      expression: `sum(rate(${metricBreakout}[$__rate_interval]))`,
    });
  }
}
