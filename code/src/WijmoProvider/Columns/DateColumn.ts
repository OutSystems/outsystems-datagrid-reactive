// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace WijmoProvider.Column {
    /**
     * Representation of OS Date Column
     * Responsible to instantiate the custom editor (calendar) and all the features of a Date column
     *
     * OS Date format doesn't consider GMT, and so this Column class. Multiple users in different locations of the Globe, will have the same information on Grid.
     * If GMT need to be consider, use the DateTimeColumn.
     */
    export class DateColumn extends AbstractProviderColumnEditor<
        OSFramework.Configuration.Column.ColumnConfig,
        OSFramework.Configuration.Column.EditorConfigDate
    > {
        constructor(
            grid: OSFramework.Grid.IGrid,
            columnID: string,
            configs: JSON,
            editorConfig: JSON
        ) {
            super(
                grid,
                columnID,
                new OSFramework.Configuration.Column.ColumnConfig(configs),
                new OSFramework.Configuration.Column.EditorConfigDate(
                    editorConfig
                )
            );
            this._columnEvents =
                new OSFramework.Event.Column.ColumnEventsManager(this);
        }

        protected _setConditionalFormat(
            conditionalFormat: any,
            refresh = false
        ): void {
            if (conditionalFormat && conditionalFormat.length > 0) {
                this.grid.features.conditionalFormat.addRules(
                    this.config.binding,
                    conditionalFormat,
                    refresh
                );
            }
        }

        /** Returns all the events associated to the column */
        public get columnEvents(): OSFramework.Event.Column.ColumnEventsManager {
            return this._columnEvents;
        }

        public get columnType(): OSFramework.Enum.ColumnType {
            return OSFramework.Enum.ColumnType.Date;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public get editorProviderType(): any {
            return wijmo.input.InputDate;
        }

        public get providerType(): wijmo.DataType {
            return wijmo.DataType.Date;
        }

        public build(): void {
            //Setting date format
            this.config.format = GridAPI.dateFormat;
            this._setConditionalFormat(this.editorConfig.conditionalFormat);

            super.build();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        public changeProperty(propertyName: string, propertyValue: any): void {
            switch (propertyName) {
                case 'conditionalFormat':
                    this._setConditionalFormat(JSON.parse(propertyValue), true);
                    this.applyConfigs();
                    this.grid.provider.invalidate(); // reapply classes
                    break;
                default:
                    super.changeProperty(propertyName, propertyValue);
            }
        }
    }
}
