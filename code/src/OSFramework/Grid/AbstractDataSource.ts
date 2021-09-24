// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace OSFramework.Grid {
    /**
     * Used to flatten the data array
     * @param dataArray
     * @returns
     */
    function FlattenArray(dataArray: JSON[]): JSON[] {
        const returnDataArray = [];
        dataArray.forEach((item) => {
            returnDataArray.push(Helper.Flatten(item));
        });

        return returnDataArray;
    }

    /**
     * Responsible for parsing string fields to its correct data type
     *
     * @param data A string of the JSON data object
     * @example OS Date fields is send as strings, and we should parse it to Date, the is done for Datetime fields.
     */
    function ToJSONFormat(
        data: string,
        convertions: Map<string, Set<string>>
        // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    ): any {
        //regex expressions for date and datetime should be described here
        const regex = {
            datetime:
                /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z?$/, //yyyy-MM-ddThh:mm:ssZ
            date: /^(\d{4})-(\d{2})-(\d{2})$/ //yyyy-MM-dd
        };

        // Parse dates saved as JSON-strings
        return JSON.parse(data, (key, value) => {
            if (typeof value === 'string') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let m: any;

                const match = (value: string, exp: RegExp) => {
                    m = value.match(exp);
                    return m;
                };

                const saveConvertion = (type: string, key: string) => {
                    const done = convertions.get(type) || new Set<string>();
                    done.add(key);
                    convertions.set(type, done);
                };

                if (match(value, regex.datetime)) {
                    saveConvertion('datetime', key);
                    return new Date(
                        Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
                    );
                } else if (match(value, regex.date)) {
                    //Considering that OS Date field do not consider GMT
                    //DataGrid also won't consider it for Date Columns
                    //PS: Datetime will consider GMT just like OS consider
                    saveConvertion('date', key);
                    return new Date(+m[1], +m[2] - 1, +m[3]);
                } else if (value === '') {
                    return undefined;
                }
            }
            return value;
        });
    }

    /**
     * Used to send data to Outsystems, converting data to OS format.
     * @param grid Grid to format data
     * @param data Data to format
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    function ToOSFormat(
        convertions: Map<string, Set<string>>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: Array<any>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): void {
        const columns = convertions.get('date') || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setDeepDate = (binding: string, object: any) => {
            if (object[binding]) {
                const dt = object[binding] as Date;

                object[binding] = new Date(
                    dt.getTime() - dt.getTimezoneOffset() * 60000
                )
                    .toISOString()
                    .substr(0, 10);
            }
        };

        columns.forEach((col) => {
            data.forEach((item) => {
                setDeepDate(col, item);
            });
        });
    }

    export abstract class AbstractDataSource implements IDataSource {
        private _counter = -1;
        private _isSingleEntity: boolean;
        protected _convertions: Map<string, Set<string>>;
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        protected _ds: Array<any>;
        protected _metadata: JSON;
        protected _parentGrid: IGrid;

        constructor() {
            // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
            this._ds = new Array<any>();
            this._convertions = new Map<string, Set<string>>();
            this._isSingleEntity = false;
        }

        private _getRowByKey(key: string) {
            return this._ds.find((item) => {
                return (
                    _.get(
                        item,
                        this.parentGrid.config.keyBinding
                    ).toString() === key
                );
            });
        }

        // set primary key field of dataItem
        private _setKeyBinding(data): any {
            // we only want to do this if we have key binding set
            if (this.parentGrid.config.keyBinding) {
                _.set(data, this.parentGrid.config.keyBinding, this._counter--);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        protected _getChangesString(itemsChanged: any): string {
            let tempArray = itemsChanged.map((p) => {
                const clonedDataItem = _.cloneDeep(p);
                this._parentGrid.rowMetadata.clear(clonedDataItem);
                return clonedDataItem;
            });

            //In-place convert data to Outsystems Format
            ToOSFormat(this._convertions, tempArray);

            if (this.isSingleEntity) {
                //if the line has a single entity or structure, let's flatten it, so that we avoid the developer
                //when deserializing to need to put in the JSONDeserialize in the target "List Record {ENTITY}" -> would require extra step.
                tempArray = FlattenArray(tempArray);
            }

            return JSON.stringify(tempArray);
        }

        /**
         * Parse JSON and get the structure of the new item.
         * @param json
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        protected _parseNewItem(): any {
            const parsedNewItem = _.cloneDeep(this._metadata);
            const converter = (object) => {
                Object.keys(object).forEach((key) => {
                    if (typeof object[key] === 'object') converter(object[key]);
                    else object[key] = undefined;
                });
            };

            converter(parsedNewItem);

            return parsedNewItem;
        }

        public get hasMetadata(): boolean {
            return !!this._metadata;
        }

        public get isSingleEntity(): boolean {
            return this._isSingleEntity;
        }

        public get parentGrid(): IGrid {
            return this._parentGrid;
        }

        public set parentGrid(grid: IGrid) {
            if (this._parentGrid === undefined) {
                this._parentGrid = grid;
            }
        }

        public addRow(position?: number, data?: JSON[]): void {
            for (let i = 0; i < data.length; i++) {
                data[i] = this._parseNewItem();

                // set primary key field of dataItem
                this._setKeyBinding(data[i]);
            }

            this._ds.splice(position, 0, ...data);
        }

        public flatten(): void {
            const newData = FlattenArray(this._ds);
            this._ds.splice(0);
            this._ds.push(...newData);
        }

        public getData(): JSON[] {
            return this._ds;
        }

        public getMetadata(): JSON {
            return this._metadata;
        }

        public getRowNumberByKey(key: string): number {
            return this.parentGrid.provider.rows.findIndex(
                (item) =>
                    _.get(item.dataItem, this.parentGrid.config.keyBinding) ===
                    key
            );
        }

        public removeRow(item: number | JSON): boolean {
            const index =
                typeof item === 'number' ? item : this._ds.indexOf(item);

            if (index === -1) return false;

            this._ds.splice(index, 1);

            return true;
        }

        public setData(data: string): void {
            // Use with a Date reviver to restore date fields
            this._convertions.clear();
            const dataJson = ToJSONFormat(data, this._convertions);

            this._metadata = dataJson.metadata;

            this._isSingleEntity =
                Object.keys(dataJson[0] || dataJson.data[0] || {}).length <= 1;

            if (this.hasMetadata) {
                this._ds = [...dataJson.data];
            } else {
                this._ds = [...dataJson];
            }
        }

        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        public toOSFormat(dataItem: any): any {
            return this._getChangesString([dataItem]);
        }

        public trimSecondsFromDate(value: string): string {
            const stringGroups = value.split(':');

            if (stringGroups.length > 2) {
                value = stringGroups.slice(0, 2).join(':');
            }

            return value;
        }

        public updateAddedRowKey(
            currentRowId: string,
            newKey: string
        ): boolean {
            const row = this._getRowByKey(currentRowId);

            if (!row) {
                return false;
            }

            // set primary key with new value
            _.set(row, this.parentGrid.config.keyBinding, newKey);
            // refresh grid with new value
            this.parentGrid.provider.invalidate();

            return true;
        }

        public abstract build(): void;
        public abstract clear(): void;
        public abstract getChanges<T extends OSStructure.ChangesDone>(
            c: new () => T
        ): T;
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        public abstract getProviderDataSource(): any;
        public abstract hasResults(): boolean;
        public abstract search(info: string): void;
    }
}
