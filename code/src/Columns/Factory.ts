// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace Column {
    export namespace ColumnFactory {
        export function MakeColumn(
            grid: Grid.IGrid,
            type: ColumnType,
            columnID: string,
            configs: JSON,
            editorConfigs: JSON
        ): IColumn {
            switch (type) {
                case ColumnType.Action:
                    return new ActionColumn(grid, columnID, configs);
                case ColumnType.Checkbox:
                    return new CheckboxColumn(grid, columnID, configs);
                case ColumnType.Currency:
                    return new CurrencyColumn(
                        grid,
                        columnID,
                        configs,
                        new EditorConfigCurrency(editorConfigs)
                    );
                case ColumnType.Date:
                    return new DateColumn(
                        grid,
                        columnID,
                        configs,
                        editorConfigs
                    );
                case ColumnType.DateTime:
                    return new DateTimeColumn(
                        grid,
                        columnID,
                        configs,
                        editorConfigs
                    );
                case ColumnType.Dropdown:
                    return new DropdownColumn(
                        grid,
                        columnID,
                        configs,
                        editorConfigs
                    );
                case ColumnType.Group:
                    return new GroupColumn(
                        grid,
                        columnID,
                        configs,
                        editorConfigs
                    );
                case ColumnType.Number:
                    return new NumberColumn(
                        grid,
                        columnID,
                        configs,
                        new EditorConfigNumber(editorConfigs)
                    );
                case ColumnType.Text:
                    return new TextColumn(
                        grid,
                        columnID,
                        configs,
                        editorConfigs
                    );
                default:
                    throw `There is no factory for this type of column (${type})`;
            }
        }
    }
}
