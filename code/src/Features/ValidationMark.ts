// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace Features {
    export interface IValidationMark {
        clear(): void;
        errorMessage(row: number, binding: string): string;
        isInvalid(row: number, binding: string): boolean;
        validate(
            row: number,
            columnID: string,
            isValid: boolean,
            errorMessage: string
        ): void;
        // clearByRow(row: number): void;
    }

    class ValidationMarkInfo {
        public errorMessage: Map<string, string>;
        public validation: Map<string, boolean>;

        constructor() {
            this.validation = new Map<string, boolean>();
            this.errorMessage = new Map<string, string>();
        }
    }

    export class ValidationMark implements IValidationMark, IBuilder {
        private _bindToColumn: Map<string, Column.IColumn>;
        private _grid: Grid.IGridWijmo;
        /** Internal label for the validation marks */
        private readonly _internalLabel = '__validationMarkFeature';
        /** Exposed methods to manipulate RowMetadata */
        private _metadata: Grid.IRowMetadata;

        constructor(grid: Grid.IGridWijmo) {
            this._grid = grid;
            this._metadata = this._grid.rowMetadata;
            this._bindToColumn = new Map<string, Column.IColumn>();
        }

        /**
         * Handler for the addNewRows.
         * @param rowNumber Number of the row that has been added to the grid.
         */
        // private _addNewRowEndingHandler(rowNumber: number): void {
        //     this._bindToColumn.forEach((columnX) => {
        //         this._x(rowNumber, columnX.provider.binding, undefined);
        //     });
        // }

        /**
         * Handler for the CellEditEnding.
         */
        private _cellEditEndingHandler(
            s: wijmo.grid.FlexGrid,
            e: wijmo.grid.CellRangeEventArgs
        ): void {
            const binding = s.getColumn(e.col).binding;
            const newValue = s.getCellData(e.row, e.col, false);
            this._triggerEventsFromColumn(e.row, binding, newValue);
        }

        /** Helper to convert the formats of Date and DateTime columns to the format of OS */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private _convertToFormat(column: Column.IColumn, value: any) {
            if (value === undefined) return;
            switch (column.columnType) {
                case Column.ColumnType.Date:
                    // Formats the date into an ISOString and then returns a substring to have the format 'YYY-MM-DD'.
                    return Helper.ToOSDate(value);
                case Column.ColumnType.DateTime:
                    // Formats the date into an ISOString and then returns it with the format 'YYY-MM-DDT00:00:000Z'.
                    return Helper.ToOSDatetime(value);
                default:
                    return value;
            }
        }

        /** Handler for the formatItem. Should add the invalid class to the cells or rows if those are invalid. */
        private _formatItems(
            grid: wijmo.grid.FlexGrid,
            e: wijmo.grid.FormatItemEventArgs
        ) {
            if (
                e.panel.cellType === wijmo.grid.CellType.Cell &&
                this._isInvalidCell(e.row, e.col)
            ) {
                wijmo.addClass(e.cell, 'wj-state-invalid');
            } else if (
                e.panel.cellType === wijmo.grid.CellType.RowHeader &&
                this._isInvalidRow(e.row)
            ) {
                wijmo.addClass(e.cell, 'wj-state-invalid');
            }
        }

        /**
         * Checks if a specific cell is invalid.
         * @param rowNumber Number of the row to check if the cell is invalid.
         * @param colNumber Number of the column to check if the cell is invalid.
         * @returns Boolean that indicates if the cell is invalid. Returns True if invalid. False, otherwise.
         */
        private _isInvalidCell(rowNumber: number, colNumber: number): boolean {
            const provider = this._grid.provider;

            if (this.hasMetadata(rowNumber)) {
                const binding = provider.getColumn(colNumber).binding;
                const metadata = this.getMetadata(rowNumber);

                return (
                    metadata.validation.has(binding) &&
                    metadata.validation.get(binding) === false
                );
            }
            return false;
        }

        /**
         * Checks if a specific row is invalid by checking if it contains any invalid cells.
         * @param rowNumber Number of the row to check if a row has invalid cells
         * @returns Boolean that indicates if the row is invalid. Returns True if invalid. False, otherwise.
         */
        private _isInvalidRow(rowNumber: number): boolean {
            if (this.hasMetadata(rowNumber)) {
                const metadata = this.getMetadata(rowNumber);
                let notInvalidCells = 0;

                for (const binding of metadata.validation.keys()) {
                    //If validation of a specific cell is equal to True
                    if (metadata.validation.get(binding) === true)
                        //Add 1 to the the validCells summatory
                        notInvalidCells++;
                    //One cell is invalid so the mark should be shown
                    else break;
                }

                //If Total changes - equals > 0 there is some dirty register on the row
                return metadata.validation.size - notInvalidCells > 0;
            }

            return false;
        }

        /**
         * Handler for the RedoingAction.
         */
        private _redoingActionHandler(
            s: wijmo.undo.UndoStack,
            e: wijmo.undo.UndoActionEventArgs
        ): void {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const action: any = e.action;
            const binding = this._grid.provider.getColumn(action.col).binding;
            this._triggerEventsFromColumn(
                action.row,
                binding,
                action._newState
            );
        }

        /**
         * Triggers the events of OnCellValueChange associated to a specific column in OS
         * @param rowNumber Number of the row to trigger the events
         * @param binding Binding of the column that contains the associated events
         * @param newValue New value of the cell after its value has changed.
         */
        private _triggerEventsFromColumn(
            rowNumber: number,
            binding: string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newValue: any
        ) {
            if (this._bindToColumn.has(binding)) {
                const column = this._bindToColumn.get(binding);

                // In the future we might want to add the validation for the IsMandatory and this might be useful
                // if (columnX.config.isMandatory && !newValue) {
                //     // Apply invalid mark because the cell is mandatory and the new value is empty
                //     GridAPI.Cells.SetCellValidation(
                //         this._grid.uniqueId,
                //         rowNumber,
                //         columnX.widgetId,
                //         false,
                //         columnX.config.errorMessage
                //     );
                // } else
                if (
                    column.hasEvents &&
                    column.columnEvents.handlers.has(
                        ExternalEvents.ColumnEventType.OnCellValueChange
                    )
                ) {
                    column.columnEvents.trigger(
                        ExternalEvents.ColumnEventType.OnCellValueChange,
                        this._convertToFormat(column, newValue),
                        rowNumber
                    );
                }
            }
        }

        /**
         * Handler for the UndoingAction.
         */
        private _undoingActionHandler(
            s: wijmo.undo.UndoStack,
            e: wijmo.undo.UndoActionEventArgs
        ): void {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const action: any = e.action;
            const binding = this._grid.provider.getColumn(action.col).binding;
            this._triggerEventsFromColumn(
                action.row,
                binding,
                action._oldState
            );
        }

        public build(): void {
            this._grid.columns.forEach((column) => {
                this._bindToColumn.set(column.config.binding, column);
            });
            this._grid.provider.cellEditEnded.addHandler(
                this._cellEditEndingHandler.bind(this)
            );
            this._grid.provider.pastedCell.addHandler(
                this._cellEditEndingHandler.bind(this)
            );
            setTimeout(() => {
                this._grid.features.undoStack.stack.undoingAction.addHandler(
                    this._undoingActionHandler.bind(this)
                );
                this._grid.features.undoStack.stack.redoingAction.addHandler(
                    this._redoingActionHandler.bind(this)
                );
            }, 1000);
            // this._grid.addedRows.addHandler(
            //     this._addNewRowEndingHandler.bind(this)
            // );
            this._grid.provider.formatItem.addHandler(
                this._formatItems.bind(this)
            );
        }

        /** Clears all the validation mark metadata associated to the rows */
        public clear(): void {
            this._metadata.clearProperty(this._internalLabel);
            this._grid.provider.invalidate(); //Mark to be refreshed
        }

        /**
         * Gets the message associated to the validation error for a specific row.
         * @param rowNumber Number of the row to get the error message.
         * @param binding Binding of the column to complement the matching on the errorMessage map
         * @returns Error message of the row specified.
         */
        public errorMessage(rowNumber: number, binding: string): string {
            return this.getMetadata(rowNumber).errorMessage.get(binding);
        }

        /**
         * Gets the metadata associated to the validation marks for a specific row.
         * @param rowNumber Number of the row to check if there is any metadata associated to the validation marks.
         * @returns ValidationMarkInfo of the row specified.
         */
        public getMetadata(rowNumber: number): ValidationMarkInfo {
            if (!this.hasMetadata(rowNumber))
                this._metadata.setMetadata(
                    rowNumber,
                    this._internalLabel,
                    new ValidationMarkInfo()
                );

            return this._metadata.getMetadata(
                rowNumber,
                this._internalLabel
            ) as ValidationMarkInfo;
        }

        /**
         * Indicates if a specific row has any metadata associated to the validation marks.
         * @param rowNumber Number of the row to check if there is any metadata associated to the validation marks.
         * @returns Boolean that indicates whether a specific row has metadata associated to the validation marks.
         */
        public hasMetadata(rowNumber: number): boolean {
            return this._metadata.hasOwnProperty(
                rowNumber,
                this._internalLabel
            );
        }

        /**
         * Indicates if a specific cell value is valid or not by giving the row number and the binding.
         * @param rowNumber Number of the row to get the validation state.
         * @param binding Binding of the column to complement the matching on the validation map
         * @returns Boolean that indicates whether a specific cell is valid or not.
         */
        public isInvalid(rowNumber: number, binding: string): boolean {
            return (
                this.getMetadata(rowNumber).validation.get(binding) === false
            );
        }

        /**
         * Used to validate a cell by setting its metadata with a state that indicates if it is valid or not.
         * @param rowNumber Number of the row in which the action of validation should be triggered.
         * @param columnWidgetID ID of the Column block in which the action of validation should be triggered.
         * @param isValid Boolean that indicates whether the cell value meets a validation or data type rule. True, if the value conforms to the rule. False, otherwise.
         * @param errorMessage Message to be shown to the user when the value introduced is not valid.
         */
        public validate(
            rowNumber: number,
            columnWidgetID: string,
            isValid: boolean,
            errorMessage: string
        ): void {
            const column = GridAPI.ColumnManager.GetColumnById(columnWidgetID)
                .provider;

            // Sets the validation map by matching the binding of the columns with the boolean that indicates whether theres is an invalid cell in the row or not.
            this.getMetadata(rowNumber).validation.set(column.binding, isValid);

            // Sets the errorMessage map by matching the binding of the columns with the error that indicates the error of the validation to be shown when this one is not valid.
            this.getMetadata(rowNumber).errorMessage.set(
                column.binding,
                errorMessage
            );

            // Makes sure the grid gets refreshed after validation
            this._grid.provider.invalidate();
        }
    }
}
