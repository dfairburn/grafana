import { DataQuery, DataSourceInstanceSettings } from '@grafana/data';
import { LokiQuery } from 'app/plugins/datasource/loki/types';
import { PromQuery } from 'app/plugins/datasource/prometheus/types';
import { CombinedRule } from 'app/types/unified-alerting';
import { AlertQuery, RulerAlertingRuleDTO } from 'app/types/unified-alerting-dto';
import { isCloudRulesSource, isGrafanaRulesSource } from './datasource';
import { isAlertingRulerRule, isGrafanaRulerRule } from './rules';

export function alertRuleToQueries(combinedRule: CombinedRule | undefined | null): AlertQuery[] {
  if (!combinedRule) {
    return [];
  }

  const { namespace, rulerRule } = combinedRule;
  const { rulesSource } = namespace;

  if (isGrafanaRulesSource(rulesSource)) {
    if (isGrafanaRulerRule(rulerRule)) {
      return rulerRule.grafana_alert.data;
    }
  }

  if (isCloudRulesSource(rulesSource)) {
    if (isAlertingRulerRule(rulerRule)) {
      const model = cloudAlertRuleToModel(rulesSource, rulerRule);

      return [
        {
          refId: model.refId,
          datasourceUid: rulesSource.uid,
          queryType: '',
          model,
        },
      ];
    }
  }

  return [];
}

function cloudAlertRuleToModel(dsSettings: DataSourceInstanceSettings, rule: RulerAlertingRuleDTO): DataQuery {
  const refId = 'A';

  switch (dsSettings.type) {
    case 'prometheus': {
      const query: PromQuery = {
        refId,
        expr: rule.expr,
      };

      return query;
    }

    case 'loki': {
      const query: LokiQuery = {
        refId,
        expr: rule.expr,
      };

      return query;
    }

    default:
      throw new Error(`Query for datasource type ${dsSettings.type} is currently not supported by cloud alert rules.`);
  }
}