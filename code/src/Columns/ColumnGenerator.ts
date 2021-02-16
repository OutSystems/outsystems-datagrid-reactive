namespace Column {
    function _columnGeneratorInternal(
        grid: Grid.IGrid,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: any,
        parentRecord = '',
        allowEdit: boolean
    ): IColumn[] {
        const _createdHeaders = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _emptyjson: any = {};
        let columnType: ColumnType;
        let createdColumns: IColumn[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let _configs: any;

        Object.keys(metadata).forEach((key) => {
            _configs = { binding: '', header: '', autoGenerated: true };
            if (typeof metadata[key] === 'string' || metadata.length === 0) {
                switch (metadata[key].toLowerCase()) {
                    case 'int32':
                    case 'int64':
                    case 'decimal':
                        columnType = ColumnType.Number;
                        break;
                    case 'boolean':
                        columnType = ColumnType.Checkbox;
                        break;
                    case 'datetime':
                        columnType = ColumnType.DateTime;
                        break;
                    case 'date':
                        columnType = ColumnType.Date;
                        break;
                    case 'byte[]':
                        //rug: going to ignore for now, binary data columns.
                        columnType = undefined;
                    // eslint-disable-next-line no-fallthrough
                    case 'string':
                    default:
                        columnType = ColumnType.Text;
                }
                if (columnType !== undefined) {
                    _configs.header = key;
                    _configs.binding = parentRecord + key;
                    _configs.allowEdit = allowEdit;

                    if (_createdHeaders.indexOf(_configs.header) !== -1) {
                        _configs.header = _configs.binding;
                    }
                    _createdHeaders.push(_configs.header);

                    createdColumns.push(
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        Column.ColumnFactory.MakeColumn(
                            grid,
                            columnType,
                            parentRecord + key,
                            _configs,
                            _emptyjson
                        )
                    );
                }
            } else {
                createdColumns = createdColumns.concat(
                    _columnGeneratorInternal(
                        grid,
                        metadata[key],
                        key + '.',
                        allowEdit
                    )
                );
            }
        });
        _createdHeaders.length = 0;
        return createdColumns;
    }

    export namespace Generator {
        export function ColumnGenerator(
            grid: Grid.IGrid,
            // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
            columnsConfigs: any,
            allowEdit: boolean
        ): IColumn[] {
            let columns: IColumn[] = [];
            if (HasMetadata(columnsConfigs)) {
                columns = _columnGeneratorInternal(
                    grid,
                    columnsConfigs.metadata,
                    '',
                    allowEdit
                );
            }
            return columns;
        }

        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        export function HasMetadata(columnsConfigs: any): boolean {
            return columnsConfigs.metadata !== undefined;
        }
    }
}
