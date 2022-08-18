// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace WijmoProvider.Feature {
    export class CellData implements OSFramework.DataGrid.Feature.ICellData {
        private _data: OSFramework.DataGrid.Grid.AbstractDataSource;
        private _grid: WijmoProvider.Grid.IGridWijmo;

        constructor(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            grid: WijmoProvider.Grid.IGridWijmo,
            data: OSFramework.DataGrid.Grid.AbstractDataSource
        ) {
            this._grid = grid;
            this._data = data;
        }

        public build(): void {
            //
        }

        public setCellData(
            rowNumber: number,
            column: OSFramework.DataGrid.Column.IColumn,
            value: string
        ): void {
            if (
                column.columnType ===
                OSFramework.DataGrid.Enum.ColumnType.DateTime
            ) {
                value = this._grid.dataSource.trimSecondsFromDate(value);
            }

            this._grid.provider.setCellData(
                rowNumber,
                column.provider.index,
                value,
                true
            );
        }
    }
}
