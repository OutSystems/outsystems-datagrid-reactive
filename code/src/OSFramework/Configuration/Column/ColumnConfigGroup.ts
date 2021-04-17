namespace OSFramework.Column {
    /**
     * Defines the configuration for Group Columns
     */
    export class ColumnConfigGroup
        extends AbstractConfiguration
        implements IConfigurationColumn {
        public align: string;
        public autoGenerated: boolean;
        public binding: string;
        public collapseTo: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public dataType: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public editor: any;
        public errorMessage: string;
        public format: string;
        public genericColumnId: string;
        public header: string;
        public isCollapsed: boolean;
        public isMandatory: boolean;
        public required: boolean;
        public uniqueId: string;
        public validateBinding: boolean;

        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        constructor(config: any, extra: any) {
            super(config);
            this.isCollapsed = extra.isCollapsed;
            this.collapseTo = extra.collapseTo;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public getProviderConfig(): any {
            return {
                header: this.header,
                isCollapsed: this.isCollapsed,
                collapseTo: this.collapseTo,
                align: this.align
            };
        }

        // eslint-disable-next-line
        public updateConfig(providerConfig: any): void {
            // Unused method, ColumnGroup is not yet defined
            // this.visible = providerConfig.visible;
            // this.width = providerConfig.width;
        }
    }
}
