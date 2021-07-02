// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace WijmoProvider.Grid {
    export class FlexGrid
        extends OSFramework.Grid.AbstractGrid<
            wijmo.grid.FlexGrid,
            OSFramework.Configuration.Grid.FlexGridConfig
        >
        implements IGridWijmo {
        private _fBuilder: WijmoProvider.Feature.FeatureBuilder;
        private _lineIsSingleEntity = false;
        private _rowMetadata: RowMetadata;

        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        constructor(gridID: string, configs: any) {
            super(
                gridID,
                new OSFramework.Configuration.Grid.FlexGridConfig(configs),
                new WijmoProvider.Grid.ProviderDataSource(),
                new WijmoProvider.Column.ColumnGenerator()
            );
        }

        // eslint-disable-next-line @typescript-eslint/member-ordering
        private _buildColumns(): void {
            this.getColumns().forEach((col) => col.build());
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private _getProviderConfig(): any {
            if (this.hasColumnsDefined()) {
                this.config.autoGenerateColumns = false;
            }

            return this.config.getProviderConfig();
        }

        public get autoGenerate(): boolean {
            return this.provider.autoGenerateColumns;
        }

        public set autoGenerate(value: boolean) {
            this.provider.autoGenerateColumns = value;
        }

        public get rowMetadata(): OSFramework.Interface.IRowMetadata {
            return this._rowMetadata;
        }

        public addColumn(col: OSFramework.Column.IColumn): void {
            super.addColumn(col);

            if (this.isReady) {
                //OS takes a while to set the WidgetId
                setTimeout(() => {
                    col.build();
                }, 0);
            }
        }

        public build(): void {
            super.build();

            this._provider = new wijmo.grid.FlexGrid(
                OSFramework.Helper.GetElementByUniqueId(this.uniqueId),
                this._getProviderConfig()
            );
            this._provider.itemsSource = this.dataSource.getProviderDataSource();
            this._rowMetadata = new RowMetadata(this._provider);

            this.buildFeatures();

            this._buildColumns();

            this._provider.itemsSource.calculatedFields = this.features.calculatedField.calculatedFields;

            this.finishBuild();
        }

        public buildFeatures(): void {
            this._fBuilder = new WijmoProvider.Feature.FeatureBuilder(this);

            this._features = this._fBuilder.features;

            this._fBuilder.build();
        }

        public changeColumnProperty(
            columnID: string,
            propertyName: string,
            // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
            propertyValue: any
        ): void {
            const column = this.getColumn(columnID);

            if (!column) {
                console.log(
                    `changeColumnProperty - column id:${columnID} not found. \nAutogenerated colums won't work here!`
                );
            } else {
                column.changeProperty(propertyName, propertyValue);
            }
        }

        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        public changeProperty(propertyName: string, value: any): void {
            const propValue = OSFramework.Enum.OS_Config_Grid[propertyName];

            switch (propValue) {
                case OSFramework.Enum.OS_Config_Grid.allowColumnSort:
                    return this.features.sort.setState(value);
                case OSFramework.Enum.OS_Config_Grid.allowFiltering:
                    return this.features.filter.setState(value);
                case OSFramework.Enum.OS_Config_Grid.rowsPerPage:
                    return this.features.pagination.changePageSize(value);
                case OSFramework.Enum.OS_Config_Grid.rowHeight:
                    return this.features.styling.changeRowHeight(value);
                case OSFramework.Enum.OS_Config_Grid.allowColumnReorder:
                    return this.features.columnReorder.setState(value);
                case OSFramework.Enum.OS_Config_Grid.allowColumnResize:
                    return this.features.columnResize.setState(value);
                case OSFramework.Enum.OS_Config_Grid.allowKeyTabNavigation:
                    return this.features.tabNavigation.setState(value);
                case OSFramework.Enum.OS_Config_Grid.allowEdit:
                    this._provider.isReadOnly = value === false;
                    return;
                case OSFramework.Enum.OS_Config_Grid.selectionMode:
                    this.features.selection.setState(value);
                    return;
                default:
                    throw Error(
                        `changeProperty - Property '${propertyName}' can't be changed.`
                    );
            }
        }

        public clearAllChanges(clearValidationMark: boolean): void {
            if (this.isReady) {
                this.dataSource.clear();
                if (clearValidationMark) {
                    this.features.validationMark.clear();
                    this.features.dirtyMark.clear();
                } else {
                    const rowList = this._provider
                        .itemsSource as wijmo.collections.CollectionView;
                    rowList.sourceCollection.forEach((element) => {
                        if (
                            this.features.validationMark.isInvalidRow(
                                element
                            ) === false
                        ) {
                            this.features.dirtyMark.clearPropertyInRow(element);
                        }
                    });
                }
            }
        }

        public dispose(): void {
            super.dispose();

            this._fBuilder.dispose();

            this._provider.dispose();
            this._provider = undefined;
        }

        public getChangesMade(): OSFramework.OSStructure.GridChanges {
            // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
            const changes = this.dataSource.getChanges(
                OSFramework.OSStructure.GridChanges
            );

            if (this._features.validationMark.invalidRows.length > 0) {
                changes.hasInvalidLines = true;
                changes.invalidLinesJSON = this.dataSource.toOSFormat(
                    this._features.validationMark.invalidRows
                );
            }

            return changes;
        }

        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        public getViewLayout(): any {
            return this._features.view.getViewLayout();
        }

        public setCellError(/*binding: string, row: number, message: string*/): void {
            throw new Error('Method not implemented.');
        }

        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        public setViewLayout(state: any): void {
            if (this.isReady) {
                this._features.view.setViewLayout(state);
            }
        }
    }
}
