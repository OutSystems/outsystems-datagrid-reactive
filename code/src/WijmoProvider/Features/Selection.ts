// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace WijmoProvider.Feature {
    /**
     * Define non-generic methods containing provider code
     */
    export interface IProviderSelection extends OSFramework.Feature.ISelection {
        getProviderAllSelections(): wijmo.grid.CellRange[];
    }

    export class Selection
        implements IProviderSelection, OSFramework.Interface.IBuilder {
        private _grid: WijmoProvider.Grid.IGridWijmo;
        private _hasSelectors: boolean;
        private _selectionMode: wijmo.grid.SelectionMode;

        /**
         * Selection constructor
         * @param grid IGridWijmo object
         * @param hasSelectors Defines if Row-Checkboxes should be created
         * @param selectionMode The current selection mode
         */
        constructor(
            grid: WijmoProvider.Grid.IGridWijmo,
            hasSelectors = false,
            selectionMode = wijmo.grid.SelectionMode.MultiRange
        ) {
            this._grid = grid;

            this._selectionMode = selectionMode;
            this._hasSelectors = hasSelectors;
        }

        public get hasSelectors(): boolean {
            return this._hasSelectors;
        }

        private _buildSelector(): void {
            if (!this._hasSelectors) return;

            const column = new wijmo.grid.Column();
            column.allowResizing = false;
            column.allowSorting = false;
            column.allowDragging = false;
            column.allowMerging = false;
            this._grid.provider.rowHeaders.columns.push(column);

            new wijmo.grid.selector.Selector(column);
            //Use event bellow along with RowMetadata to save checked items per page
            //selector.onItemChecked
        }

        private _getCheckedRows(): number[] {
            return this._grid.provider.rows
                .filter((p) => p.isSelected)
                .map((p) => p.index);
        }

        /**
         * Responsable for maintain unique selections, user can't have the same range selected twice
         * @param grid Object triggering the event
         * @param e CellRangeEventArgs, defined the current selection
         */
        private _selectionChanging(
            grid: wijmo.grid.FlexGrid,
            e: wijmo.grid.CellRangeEventArgs
        ) {
            //This method just makes sense for MultiRange
            if (grid.selectionMode !== wijmo.grid.SelectionMode.MultiRange)
                return;
            const curr = e.range;
            const selectedRanges = grid._selHdl.extendedSelection;

            //Traverses the array of selected-ranges
            for (let i = selectedRanges.length - 1; i >= 0; i--) {
                //Check intersection
                if (curr.intersects(selectedRanges[i])) {
                    selectedRanges.removeAt(i);
                }
            }
        }

        public build(): void {
            this._buildSelector();

            //Set SelectionMode after defining Selectors, because wijmo will redefine them
            this.setState(this._selectionMode);

            this._grid.provider.selectionChanging.removeHandler(
                this._selectionChanging
            );
            this._grid.provider.selectionChanging.addHandler(
                this._selectionChanging
            );
            this._grid.provider.copying.addHandler(
                this.equalizeSelection.bind(this)
            );
        }

        public clear(): void {
            //As wijmo handles the selections in different objects considering the multiple wijmo.grid.SelectionMode
            //To simply clear all selections a lot more complex code would be here...
            //So I end up removing and re-applying the selection mode to clear things out
            this._grid.provider.selectionMode = wijmo.grid.SelectionMode.None;
            this._grid.provider.selectionMode = this._selectionMode;
        }

        public contains(
            rng: number | wijmo.grid.CellRange,
            col1?: number,
            row2?: number,
            col2?: number
        ): boolean {
            let range: wijmo.grid.CellRange;

            if (wijmo.isNumber(rng)) {
                range = new wijmo.grid.CellRange(rng, col1, row2, col2);
            } else {
                range = rng;
            }

            return this.getProviderAllSelections().some((p) =>
                p.intersects(range)
            );
        }

        public equalizeSelection(): OSFramework.OSStructure.CellRange[] {
            //This method just makes sense for MultiRange
            if (
                this._grid.provider.selectionMode !==
                wijmo.grid.SelectionMode.MultiRange
            )
                return;
            const grid = this._grid.provider; //Auxiliar for grid
            let leftCol = grid.columns.length - 1; //Set to max-lenght to facilitate Math.min
            let rightCol = -1; //Set to -1 to facilitate Math.max

            //When NO row is selected, find most left and right column looking to selectedRanges
            this.getProviderAllSelections().forEach((p) => {
                leftCol = Math.min(leftCol, p.leftCol, p.rightCol);
                rightCol = Math.max(rightCol, p.leftCol, p.rightCol);
            });

            //Adjusting structure
            grid.deferUpdate(() => {
                //Auxiliar to save combined ranges
                const rangesToRemove: wijmo.grid.CellRange[] = [];
                const activeSelection = grid._selHdl.selection;
                const selectedRanges = grid._selHdl.extendedSelection;

                //Traverse array looking for range intersection
                //Current selection in the first place prevent it from being deleted
                [activeSelection, ...selectedRanges.slice()]
                    .map((p) => {
                        p.setRange(p.topRow, leftCol, p.bottomRow, rightCol);
                        return p;
                    })
                    .forEach((curr, index, array) => {
                        //When marked to remove ignore
                        if (rangesToRemove.filter((p) => p === curr).length > 0)
                            return;

                        for (let i = index + 1; i < array.length; i++) {
                            //Verify intersection
                            if (curr.intersects(array[i])) {
                                //Combine intersection with current selection
                                const combined = curr.combine(array[i]);

                                //Update current
                                curr.setRange(
                                    combined.topRow,
                                    combined.leftCol,
                                    combined.bottomRow,
                                    combined.rightCol
                                );

                                //Mark intersection to be removed
                                rangesToRemove.push(array[i]);
                            }
                        }
                    });

                //Remove combined ranges
                rangesToRemove.forEach((p) => selectedRanges.remove(p));
            });

            return grid.selectedRanges
                .sort(
                    (a, b) => a.bottomRow - b.bottomRow || a.topRow - b.topRow
                )
                .map((p) =>
                    WijmoProvider.Helper.CellRangeFactory.MakeFromProviderCellRange(
                        p
                    )
                );
        }

        public getActiveCell(): OSFramework.OSStructure.CellRange {
            const currSelection = this._grid.provider.selection;

            if (currSelection && currSelection.isValid)
                //currSelection has the last range selected
                //properties row and col maintain the last cell selected or in a range, where the mouse button was released
                return WijmoProvider.Helper.CellRangeFactory.MakeFromCoordinates(
                    currSelection.row,
                    currSelection.col
                );
            else return undefined;
        }

        public getAllSelections(): OSFramework.OSStructure.CellRange[] {
            return this.getProviderAllSelections().map((p) =>
                WijmoProvider.Helper.CellRangeFactory.MakeFromProviderCellRange(
                    p
                )
            );
        }

        public getAllSelectionsData(): OSFramework.OSStructure.RowData[] {
            const rowColumn = new Map<
                number,
                OSFramework.OSStructure.RowData
            >();
            const rowColumnArr = [];

            this.getProviderAllSelections().map((range) => {
                const bindings = Array(range.rightCol - range.leftCol + 1)
                    .fill(0)
                    .map((_, idx) =>
                        this._grid.provider.getColumn(range.leftCol + idx)
                    )
                    .filter((p) => p.isVisible)
                    .map((p) => p.binding);

                Array(range.bottomRow - range.topRow + 1)
                    .fill(0)
                    .map((_, idx) => range.topRow + idx)
                    .map((rowIndex) => {
                        let curr = rowColumn.get(rowIndex);

                        if (!curr) {
                            curr = new OSFramework.OSStructure.RowData(
                                this._grid,
                                rowIndex,
                                this._grid.provider.rows[rowIndex].dataItem
                            );

                            rowColumnArr.push(curr);
                            rowColumn.set(rowIndex, curr);
                        }

                        curr.selected.push(
                            ...bindings.map(
                                (binding) =>
                                    new OSFramework.OSStructure.BindingValue(
                                        binding,
                                        this._grid.provider.getCellData(
                                            rowIndex,
                                            binding,
                                            false
                                        )
                                    )
                            )
                        );
                    });
            });

            rowColumn.clear();
            return rowColumnArr;
        }

        public getProviderAllSelections(): wijmo.grid.CellRange[] {
            const ranges: wijmo.grid.CellRange[] = [];
            const maxCol = this._grid.provider.columns.length - 1;
            //// wijmo.grid.SelectionMode.ListBox, Row and RowRange not supported yet,
            //// there is a conflict with wijmo.grid.selector.Selector
            // if (this._grid.grid.selectionMode === wijmo.grid.SelectionMode.ListBox
            //     || this._grid.grid.selectionMode === wijmo.grid.SelectionMode.Row
            //     || this._grid.grid.selectionMode === wijmo.grid.SelectionMode.RowRange) {
            //     rows = this._grid.grid.selectedRows
            //         .map(p => new wijmo.grid.CellRange(p.index, 0, p.index, maxCol));
            // }
            // else {
            ranges.push(
                ...this._grid.provider.selectedRanges.filter((p) => p.isValid)
            );
            // }
            return this._getCheckedRows()
                .map((p) => new wijmo.grid.CellRange(p, 0, p, maxCol))
                .filter((p) => {
                    for (let i = 0; i < ranges.length; i++) {
                        if (ranges[i].contains(p)) return false;
                    }
                    return true;
                })
                .concat(ranges);
        }

        public getSelectedRows(): number[] {
            const rows: number[] = [];
            const maxCol = this._grid.provider.columns.length - 1;

            this.getProviderAllSelections()
                .filter((p) => p.leftCol === 0 && p.rightCol === maxCol)
                .map((range) => {
                    rows.push(
                        ...Array(range.bottomRow - range.topRow + 1)
                            .fill(0)
                            .map((_, idx) => range.topRow + idx)
                    );
                });

            return rows;
        }

        public getSelectedRowsCount(): number {
            return this.getSelectedRows().length;
        }

        public getSelectedRowsCountByCellRange(): number {
            //Runs the equalize to garantee that the same row is not selected more than once
            this.equalizeSelection();
            return this.getAllSelections().reduce(
                (acc, sel) => acc + (sel.bottomRowIndex - sel.topRowIndex + 1),
                0
            );
        }

        public getSelectedRowsData(): OSFramework.OSStructure.RowData[] {
            return this.getSelectedRows().map(
                (rowIndex) =>
                    new OSFramework.OSStructure.RowData(
                        this._grid,
                        rowIndex,
                        this._grid.provider.rows[rowIndex].dataItem
                    )
            );
        }

        public hasSelectedRows(): boolean {
            return this.getSelectedRows().length > 0;
        }

        public hasValidSelection(): boolean {
            return this._grid.provider.selection.isValid;
        }

        // eslint-disable-next-line @typescript-eslint/no-inferrable-types
        public selectAndFocusFirstCell(rowIndex: number = 0): void {
            this._grid.provider.select(
                new wijmo.grid.CellRange(rowIndex, 0, rowIndex, 0),
                true
            );
        }

        public setState(value: wijmo.grid.SelectionMode): void {
            // wijmo.grid.SelectionMode.ListBox, Row and RowRange not supported yet,
            // there is a conflict with wijmo.grid.selector.Selector
            if (
                value === wijmo.grid.SelectionMode.ListBox ||
                value === wijmo.grid.SelectionMode.Row ||
                value === wijmo.grid.SelectionMode.RowRange
            ) {
                throw new Error(
                    `Selection Feature - Unsupported selectionMode '${value}'!`
                );
            }
            this._selectionMode = value;
            this._grid.provider.selectionMode = value;
        }
    }
}
