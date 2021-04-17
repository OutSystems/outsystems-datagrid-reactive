namespace OSFramework.Feature {
    export interface IColumnFilter
        extends OSFramework.Interface.IBuilder,
            OSFramework.Interface.IValidation,
            OSFramework.Interface.IProviderConfig<boolean>,
            IView {
        isGridFiltered: boolean;
        activate(columID: string): void;
        clear(columID: string): void;
        deactivate(columID: string): void;
    }
}
