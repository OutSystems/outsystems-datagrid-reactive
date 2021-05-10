// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace WijmoProvider.Feature {
    enum NumberRules {
        GreaterOrEqualsTo = '>=',
        GreaterThan = '>',
        Equals = '===',
        LessOrEqualsTo = '<=',
        LessThan = '<',
        NotEquals = '!=='
    }

    function Evaluate(operator, comparedValue, cellValue) {
        switch (operator) {
            case NumberRules.GreaterOrEqualsTo:
                return cellValue >= comparedValue;
            case NumberRules.GreaterThan:
                return cellValue > comparedValue;
            case NumberRules.Equals:
                return comparedValue === cellValue;
            case NumberRules.NotEquals:
                return comparedValue !== cellValue;
            case NumberRules.LessOrEqualsTo:
                return cellValue <= comparedValue;
            case NumberRules.LessThan:
                return cellValue < comparedValue;
            default:
                break;
        }
    }

    class Condition {
        public condition: NumberRules;
        public value: any;

        constructor(condition: NumberRules, value: any) {
            this.condition = condition;
            this.value = value;
        }
    }

    class ConditionAnd {
        public cellClass: string;
        public rowClass: string;
        public rules: Array<Condition>;

        constructor(
            cellClass: string,
            rowClass: string,
            rules: Array<Condition>
        ) {
            this.cellClass = cellClass;
            this.rowClass = rowClass;
            this.rules = rules;
        }

        public evaluate(cellValue: any = 0): boolean {
            const evaluated = this.rules.map((rule) => {
                return Evaluate(rule.condition, rule.value, cellValue);
            });

            return evaluated.indexOf(false) === -1;
        }
    }

    class ConditionExecuter {
        private _metadata: OSFramework.Interface.IRowMetadata;
        public conditions: Array<ConditionAnd>;

        constructor(conditions: Array<ConditionAnd>) {
            this.conditions = conditions;
        }

        public execute(
            grid: Grid.IGridWijmo,
            cellValue: any,
            e: wijmo.grid.FormatItemEventArgs
        ) {
            this.conditions.some((p) => {
                const isTrue = p.evaluate(cellValue);
                const binding = grid.provider.getColumn(e.col).binding;

                if (isTrue) {
                    if (p.rowClass) {
                        grid.features.rows.addClass(e.row, p.rowClass, false);
                    }
                    if (p.cellClass) {
                        grid.features.cellStyle.addClass(
                            binding,
                            e.row,
                            p.cellClass
                        );
                    }
                } else {
                    if (p.rowClass) {
                        grid.features.rows.removeClass(
                            e.row,
                            p.rowClass,
                            false
                        );
                    }
                    if (p.cellClass) {
                        grid.features.cellStyle.removeClass(e.row, binding);
                    }
                }

                return isTrue;
            });
        }
    }

    export class ConditionalFormat
        implements
            OSFramework.Interface.IBuilder,
            OSFramework.Interface.IDisposable {
        private _grid: Grid.IGridWijmo;
        private _mappedRules: Map<string, ConditionExecuter>;

        constructor(grid: Grid.IGridWijmo) {
            this._grid = grid;
            this._mappedRules = new Map<string, ConditionExecuter>();
        }
        private _parseRule(
            rules: Array<OSFramework.OSStructure.ConditionalFormat>
        ): ConditionExecuter {
            const conditionExecuters = [];
            rules.forEach((element) => {
                const conditions: Array<Condition> = element.format.map((c) => {
                    return new Condition(NumberRules[c.condition], c.value);
                });
                const conditionAnds = new ConditionAnd(
                    element.cellClass,
                    element.rowClass,
                    conditions
                );
                conditionExecuters.push(conditionAnds);
            });
            return new ConditionExecuter(conditionExecuters);
        }

        public addRule(
            column: string,
            rules: Array<OSFramework.OSStructure.ConditionalFormat>
        ): void {
            this._mappedRules.set(column, this._parseRule(rules));
        }

        public build(): void {
            this._grid.provider.formatItem.addHandler(
                (s: wijmo.grid.FlexGrid, e: wijmo.grid.FormatItemEventArgs) => {
                    if (e.panel.cellType === wijmo.grid.CellType.Cell) {
                        const col = s.getColumn(e.col);

                        if (this._mappedRules.has(col.binding)) {
                            const cellData = s.getCellData(e.row, e.col, false);

                            this._mappedRules
                                .get(col.binding)
                                .execute(this._grid, cellData, e);
                        }
                    }
                }
            );
        }
        public dispose(): void {
            throw new Error('Method not implemented.');
        }
    }
}
